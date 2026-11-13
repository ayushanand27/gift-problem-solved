import os
E2E = os.environ.get('E2E_DIR') or os.path.join(os.path.expanduser('~'), '.shagun-e2e')
import re, time, glob
from playwright.sync_api import sync_playwright
B='http://localhost:3100'; ok=bad=0
def check(n,c):
    global ok,bad
    print(('PASS ' if c else 'FAIL ')+n); ok+=bool(c); bad+=(not c)
def mails(): return sorted(glob.glob(E2E+'/mail/*.eml'))
def link_since(n,path,to=15):
    t=time.time()
    while time.time()-t<to:
        for f in reversed(mails()[n:]):
            b=open(f).read().replace('=\n','').replace('=3D','=')
            m=re.search(r'http://localhost:3100'+path+r'\?t=[\w-]+', b)
            if m: return m.group(0)
        time.sleep(.3)
with sync_playwright() as p:
    br=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    # interactive demo
    d=br.new_context(viewport={'width':390,'height':800}).new_page(); errs=[]
    d.on('console', lambda m: errs.append(m.text[:120]) if m.type=='error' else None)
    d.goto(B+'/demo'); d.wait_for_timeout(1000)
    d.fill('[name=code]','000000'); d.click('button:has-text("Open the page")'); check('demo rejects wrong code', 'is 123456' in d.inner_text('main'))
    d.fill('[name=code]','123456'); d.click('button:has-text("Open the page")'); d.wait_for_timeout(300)
    check('demo shows goals', 'Honeymoon in Kerala' in d.inner_text('main'))
    d.click('button:has-text("Continue to pay")'); check('demo needs a name', 'Enter your name' in d.inner_text('main'))
    d.fill('input[placeholder="Neha Mausi"]','Neha Mausi'); d.click('button:has-text("Continue to pay")'); d.wait_for_timeout(300)
    d.fill('[name=utr]','123'); d.click('button:has-text("Get my certificate")'); check('demo checks 12 digits', 'exactly 12 digits' in d.inner_text('main'))
    d.fill('[name=utr]','412345678901'); d.click('button:has-text("Get my certificate")'); d.wait_for_timeout(300)
    t=d.inner_text('main'); check('demo certificate starts not verified', 'Neha Mausi' in t and 'Not verified' in t)
    d.click('button:has-text("Play the couple")'); d.wait_for_timeout(200); check('demo confirm works', 'confirmed by the couple' in d.inner_text('main').lower())
    check('demo no overflow on phone', not d.evaluate("document.documentElement.scrollWidth>innerWidth")); check('demo no console errors', not errs)
    # real app: UTR fix
    c=br.new_context().new_page(); n=len(mails())
    c.goto(B+'/signup'); c.fill('[name=email]','fix@example.com'); c.fill('[name=password]','fix-pass-12345'); c.check('[name=agree]'); c.click('button.primary'); c.wait_for_url('**/dashboard')
    c.goto(link_since(n,'/verify')); c.click('main button'); c.wait_for_timeout(800); c.goto(B+'/dashboard')
    c.fill('[name=partner_one]','Sam'); c.fill('[name=partner_two]','Tia'); c.fill('[name=upi_id]','sam@okhdfcbank'); c.fill('[name=upi_id_confirm]','sam@okhdfcbank'); c.fill('[name=payee_name]','Sam and Tia'); c.fill('[name=goal_title_0]','Trip'); c.fill('[name=goal_target_0]','50000'); c.click('button.primary'); c.wait_for_timeout(1200); c.goto(B+'/dashboard')
    slug=re.search(r'/w/([0-9a-f]{12})', c.content()).group(1); code=c.inner_text('.code').strip()
    def gift(utr, who):
        g=br.new_context().new_page(); g.goto(f'{B}/w/{slug}'); g.fill('[name=code]',code); g.click('button.btn.primary'); g.wait_for_timeout(600)
        g.fill('[name=guest_name]',who); g.fill('[name=amount]','1000'); g.click('button.btn.primary'); g.wait_for_timeout(800)
        g.fill('[name=utr]',utr); g.click('button:has-text("certificate")'); g.wait_for_timeout(1200); return g
    a=gift('111111111111','Anu'); b=gift('222222222222','Bina')
    check('guest A got certificate', '/gift/' in a.url)
    a.click('summary:has-text("wrong")'); a.fill('details [name=utr]','22222222222'); a.click('details button'); a.wait_for_timeout(300)
    a.fill('details [name=utr]','222222222222'); a.click('details button'); a.wait_for_timeout(1000)
    check('fix to an already-used UTR refused', 'already been used' in a.inner_text('main'))
    a.click('summary:has-text("wrong")'); a.fill('details [name=utr]','333333333333'); a.click('details button'); a.wait_for_timeout(1000)
    check('guest can correct own UTR', 'Reference number updated' in a.inner_text('main'))
    c.goto(B+'/dashboard'); check('couple sees corrected UTR', '333333333333' in c.inner_text('main'))
    # after confirmation the fix is locked
    while c.locator('button[value=confirmed]').count():
        c.locator('button[value=confirmed]').first.click(); c.wait_for_timeout(900)
    a.reload(); a.wait_for_timeout(500)
    check('fix form gone once the couple confirmed', a.locator('summary:has-text("wrong")').count()==0)
    # someone without the key cannot fix
    pub=re.sub(r'\?k=.*','',a.url); r=br.new_context().new_page(); r.goto(pub); check('public view has no fix form', r.locator('summary:has-text("wrong")').count()==0)
print(ok,'passed',bad,'failed')
