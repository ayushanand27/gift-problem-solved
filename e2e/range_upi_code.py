import re, time, glob, os
from playwright.sync_api import sync_playwright
B='http://localhost:3100'; ok=0; bad=0
def check(n,c):
    global ok,bad
    print(('PASS ' if c else 'FAIL ')+n); ok+=bool(c); bad+=(not c)
def mails(): return sorted(glob.glob('/tmp/tests/mail/*.eml'))
def link_since(n, path, to=15):
    t=time.time()
    while time.time()-t<to:
        for f in reversed(mails()[n:]):
            b=open(f).read().replace('=\n','').replace('=3D','=')
            m=re.search(r'http://localhost:3100'+path+r'\?t=[\w-]+', b)
            if m: return m.group(0)
        time.sleep(.3)
with sync_playwright() as p:
    br=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    c=br.new_context().new_page(); n=len(mails())
    c.goto(B+'/signup'); c.fill('[name=email]','sam@example.com'); c.fill('[name=password]','sam-pass-1234'); c.check('[name=agree]'); c.click('button.primary'); c.wait_for_url('**/dashboard')
    c.goto(link_since(n,'/verify')); c.click('main button'); c.wait_for_timeout(800); c.goto(B+'/dashboard')
    # sliders: min up past max drags max, max down below min drags min
    def val(name): return int(c.eval_on_selector(f'[name={name}]','e=>e.value'))
    def setv(name,v): c.eval_on_selector(f'[name={name}]','(e,v)=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set; s.call(e,v); e.dispatchEvent(new Event("input",{bubbles:true}));}', str(v))
    setv('max_amount',2000); c.wait_for_timeout(200); setv('min_amount',5001); c.wait_for_timeout(200)
    check('min above max drags max up', val('max_amount')>=val('min_amount'))
    setv('max_amount',1000); c.wait_for_timeout(200)
    check('max below min drags min down', val('min_amount')<=val('max_amount'))
    setv('min_amount',501); setv('max_amount',51000)
    fill=lambda u,u2: (c.fill('[name=partner_one]','Sam'),c.fill('[name=partner_two]','Tia'),c.fill('[name=upi_id]',u),c.fill('[name=upi_id_confirm]',u2),c.fill('[name=payee_name]','Sam and Tia'),c.fill('[name=goal_title_0]','Trip'),c.fill('[name=goal_target_0]','50000'))
    fill('sam@okhdfcbank','sam@okhdfcbnk'); c.click('button.primary'); c.wait_for_url('**e=upiconfirm**')
    check('typo in confirm field refused', 'do not match' in c.inner_text('main'))
    fill('sam@weirdbank','sam@weirdbank'); c.click('button.primary'); c.wait_for_url('**e=upihandle**')
    check('unknown bank handle needs the test box', 'do not recognise' in c.inner_text('main'))
    fill('sam@weirdbank','sam@weirdbank'); c.check('[name=upi_checked]'); c.click('button.primary'); c.wait_for_timeout(1200); c.goto(B+'/dashboard')
    check('unknown handle ok once ticked', 'wedding card' in c.inner_text('main').lower())
    # guest cookie dies when the code changes
    slug=re.search(r'/w/([0-9a-f]{12})', c.content()).group(1)
    code=c.inner_text('.code').strip()
    g=br.new_context().new_page(); g.goto(f'{B}/w/{slug}'); g.fill('[name=code]',code); g.click('button.btn.primary'); g.wait_for_timeout(800)
    check('guest opens with code', 'Choose what to gift' in g.inner_text('main'))
    c.click('summary:has-text("Code leaked")'); c.fill('details.code-reset [name=current_password]','wrong-pass-0'); c.click('details.code-reset button'); c.wait_for_url('**e=current**')
    check('new code needs the right password', 'current password' in c.inner_text('main').lower())
    c.click('summary:has-text("Code leaked")'); c.fill('details.code-reset [name=current_password]','sam-pass-1234'); c.click('details.code-reset button'); c.wait_for_url('**e=newcode**')
    new=c.inner_text('.code').strip()
    check('code changed', new!=code and len(new)==6)
    g.goto(f'{B}/w/{slug}'); check('old guest session closed after code change', 'Enter the code' in g.inner_text('main'))
    g.fill('[name=code]',code); g.click('button.btn.primary'); g.wait_for_timeout(600)
    check('old code refused', 'does not match' in g.inner_text('main'))
    g.fill('[name=code]',new); g.click('button.btn.primary'); g.wait_for_timeout(800)
    check('new code works', 'Choose what to gift' in g.inner_text('main'))
print(ok,'passed',bad,'failed')
