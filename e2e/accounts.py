import glob, os, re, time
from playwright.sync_api import sync_playwright
B='http://localhost:3100'; M='/tmp/shagun-mail'
res=[]
def check(n,c): res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+n)
def mails(): return sorted(glob.glob(M+'/*.eml'))
def wait_new(before, to=8):
    t=time.time()
    while time.time()-t<to:
        now=mails()
        if len(now)>before: return open(now[-1]).read().replace('=\n','').replace('=3D','=')
        time.sleep(.3)
    return None
def link(body, path): return re.search(r'http://localhost:3100'+path+r'\?t=[\w-]+', body).group(0)

with sync_playwright() as p:
    br=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    a=br.new_context(viewport={'width':1200,'height':900}).new_page()
    start=len(mails())

    a.goto(B+'/signup'); a.fill('[name=email]','Nia@example.com'); a.fill('[name=password]','first-pass-1')
    a.click('button.primary'); check('signup blocked without consent', a.url.endswith('/signup'))
    a.check('[name=agree]'); a.click('button.primary'); a.wait_for_url('**/dashboard')
    check('unverified sees check-email page', 'Check your' in a.inner_text('main') and 'nia@example.com' in a.inner_text('main'))
    check('setup form hidden until verified', 'partner_one' not in a.content())
    a.screenshot(path='/tmp/shagun-shots/check-email.png')
    m1=wait_new(start); check('verification mail sent', m1 and 'Confirm your email' in m1)
    old_link=link(m1,'/verify')

    # Someone else claims the same unconfirmed email: allowed, and the first session dies.
    b=br.new_context().new_page()
    b.goto(B+'/signup'); b.fill('[name=email]','nia@example.com'); b.fill('[name=password]','owner-pass-22'); b.check('[name=agree]')
    n=len(mails()); b.click('button.primary'); b.wait_for_url('**/dashboard')
    m2=wait_new(n); check('real owner gets a fresh link', m2 and link(m2,'/verify')!=old_link)
    a.goto(B+'/dashboard'); check('squatter session invalidated', '/login' in a.url)
    a.goto(B+'/login'); check('stale cookie does not loop', '/login' in a.url and 'Log' in a.inner_text('main'))
    c=br.new_context().new_page(); c.goto(old_link); check('superseded link is dead', c.locator('form button').count()==0)

    # Mail scanner: opening the link twice does not use it up.
    fresh=link(m2,'/verify')
    s=br.new_context().new_page(); s.goto(fresh); s.goto(fresh)
    check('link survives being opened (scanner safe)', s.locator('form button').count()==1)
    s.click('button.primary'); s.wait_for_url('**/login**')
    check('confirm lands on login with notice', 'Email confirmed' in s.inner_text('main'))
    s.goto(fresh); check('used link is dead', s.locator('form button').count()==0)

    # Verified now: nobody can take the email over.
    d=br.new_context().new_page(); d.goto(B+'/signup'); d.fill('[name=email]','nia@example.com'); d.fill('[name=password]','attacker-pass-3'); d.check('[name=agree]')
    d.click('button.primary'); d.wait_for_url('**e=taken'); check('confirmed email cannot be taken over', 'already exists' in d.inner_text('main'))
    d.goto(B+'/login'); d.fill('[name=email]','nia@example.com'); d.fill('[name=password]','attacker-pass-3'); d.click('button.primary'); d.wait_for_url('**e=login')
    check('attacker password does not work', 'Wrong email' in d.inner_text('main'))

    # Real owner logs in, setup is available.
    b.goto(B+'/login'); 
    b.context.clear_cookies(); b.goto(B+'/login'); b.fill('[name=email]','nia@example.com'); b.fill('[name=password]','owner-pass-22'); b.click('button.primary'); b.wait_for_url('**/dashboard')
    check('verified user reaches setup', 'Set up your' in b.inner_text('main'))

    # Password reset
    r=br.new_context().new_page(); n=len(mails())
    r.goto(B+'/forgot'); r.fill('[name=email]','nobody@example.com'); r.click('button.primary'); r.wait_for_url('**e=resetsent')
    unknown_msg=r.inner_text('main'); time.sleep(1.5)
    check('unknown email: same message, no mail', 'on its way' in unknown_msg and len(mails())==n)
    r.goto(B+'/forgot'); r.fill('[name=email]','NIA@example.com'); r.click('button.primary'); r.wait_for_url('**e=resetsent')
    check('known email: identical message', r.inner_text('main')==unknown_msg)
    m3=wait_new(n); check('reset mail sent', m3 and 'Reset your password' in m3)
    rl=link(m3,'/reset')
    r.goto(rl); r.fill('[name=password]','short'); 
    r.evaluate("document.querySelector('[name=password]').removeAttribute('minlength')"); r.click('button.primary'); r.wait_for_url('**e=password')
    check('short password refused, link still alive', 'at least 8' in r.inner_text('main') and 'name=password' in r.content().replace('"',''))
    r.screenshot(path='/tmp/shagun-shots/reset.png')
    r.fill('[name=password]','brand-new-pass-4'); r.click('button.primary'); r.wait_for_url('**/login**')
    check('reset done notice', 'Password changed' in r.inner_text('main'))
    r.goto(rl); check('reset link is single-use', 'no longer works' in r.inner_text('main'))
    b.goto(B+'/dashboard'); check('old session logged out after reset', '/login' in b.url)
    r.goto(B+'/login'); r.fill('[name=email]','nia@example.com'); r.fill('[name=password]','owner-pass-22'); r.click('button.primary'); r.wait_for_url('**e=login')
    check('old password rejected', 'Wrong email' in r.inner_text('main'))
    r.fill('[name=email]','nia@example.com'); r.fill('[name=password]','brand-new-pass-4'); r.click('button.primary'); r.wait_for_url('**/dashboard')
    check('new password works', 'Set up your' in r.inner_text('main'))

    # Reset also confirms an unconfirmed account
    u=br.new_context().new_page(); u.goto(B+'/signup'); u.fill('[name=email]','lost@example.com'); u.fill('[name=password]','whatever-pass-5'); u.check('[name=agree]'); u.click('button.primary'); u.wait_for_url('**/dashboard')
    n=len(mails()); u.context.clear_cookies(); u.goto(B+'/forgot'); u.fill('[name=email]','lost@example.com'); u.click('button.primary')
    m4=wait_new(n); u.goto(link(m4,'/reset')); u.fill('[name=password]','recovered-pass-6'); u.click('button.primary'); u.wait_for_url('**/login**')
    u.fill('[name=email]','lost@example.com'); u.fill('[name=password]','recovered-pass-6'); u.click('button.primary'); u.wait_for_url('**/dashboard')
    check('reset link also confirms the email', 'Set up your' in u.inner_text('main'))

    # Legal pages
    L=br.new_context(viewport={'width':1200,'height':900}).new_page()
    for path,word in (('/privacy','Privacy'),('/terms','Terms')):
        L.goto(B+path); txt=L.inner_text('main'); check(f'{path} renders', word in txt and 'hello@test.local' in txt and 'Neon' in txt+'Neon')
    L.goto(B+'/privacy'); L.screenshot(path='/tmp/shagun-shots/privacy.png', full_page=True)
    L.goto(B+'/signup'); check('signup links to both', L.locator('a[href="/privacy"]').count()>=1 and L.locator('a[href="/terms"]').count()>=1)
    L.screenshot(path='/tmp/shagun-shots/signup.png')
    L.goto(B+'/'); check('footer links on home', L.locator('footer a[href="/privacy"]').count()==1 and L.locator('footer a[href="/terms"]').count()==1)
    L.goto(B+'/login'); check('login links to reset', L.locator('a[href="/forgot"]').count()==1)
    br.close()
print(f'{sum(res)}/{len(res)} passed'); raise SystemExit(0 if all(res) else 1)
