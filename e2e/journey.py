import re, sys, glob, time
from playwright.sync_api import sync_playwright

B = 'http://localhost:3100'
ok = []
def check(name, cond):
    ok.append((name, bool(cond)))
    print(('PASS ' if cond else 'FAIL ') + name)

with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    couple = br.new_context(viewport={'width': 1200, 'height': 900})
    c = couple.new_page()
    errs = []
    c.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)

    c.goto(B); c.screenshot(path='/tmp/shagun-shots/home.png', full_page=True)
    c.goto(B + '/dashboard'); check('dashboard needs login', '/login' in c.url)

    c.goto(B + '/signup')
    c.fill('[name=email]', 'riya@example.com'); c.fill('[name=password]', 'correct-horse-9')
    c.check('[name=agree]'); c.click('button.primary'); c.wait_for_url('**/dashboard')
    check('signup asks to confirm email', 'Check your' in c.inner_text('main'))
    time.sleep(1.5)
    body = open(sorted(glob.glob('/tmp/shagun-mail/*.eml'))[-1]).read().replace('=\n','').replace('=3D','=')
    c.goto(re.search(r'http://localhost:3100/verify\?t=[\w-]+', body).group(0)); c.click('button.primary'); c.wait_for_url('**/dashboard**')
    check('already-logged-in user sees confirmation notice', 'Email confirmed' in c.inner_text('main'))
    check('signup lands on setup', 'Set up your gift page' in c.inner_text('main'))

    c.fill('[name=partner_one]', 'Riya'); c.fill('[name=partner_two]', 'Aman')
    c.fill('[name=wedding_date]', '2027-02-14')
    c.fill('[name=upi_id]', 'riya.aman@okhdfcbank'); c.fill('[name=payee_name]', 'Riya Sharma and Aman Verma')
    c.fill('[name=goal_title_0]', 'Honeymoon in Kerala'); c.fill('[name=goal_target_0]', '150000')
    c.fill('[name=goal_title_1]', 'Home loan'); c.fill('[name=goal_target_1]', '500000')
    c.fill('[name=goal_title_2]', "First child's education"); c.fill('[name=goal_target_2]', '300000')
    c.screenshot(path='/tmp/shagun-shots/setup.png', full_page=True)
    c.click('text=Create our gift page'); c.wait_for_selector('.code')
    code = c.inner_text('.code').strip(); url = c.inner_text('.link-text').strip()
    slug = url.rsplit('/', 1)[1]
    check('card code is 6 digits', re.fullmatch(r'\d{6}', code))
    check('slug looks random', re.fullmatch(r'[0-9a-f]{12}', slug))

    # Guest on a phone
    guest = br.new_context(viewport={'width': 390, 'height': 844})
    g = guest.new_page()
    g.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    g.goto(f'{B}/w/{slug}/pay?goal_id=x&amount=5'); check('pay page locked without code', g.url.endswith(f'/w/{slug}'))
    check('gate hides couple details', 'Riya' not in g.content())
    wrong = '000000' if code != '000000' else '111111'
    g.fill('[name=code]', wrong); g.click('button.primary'); g.wait_for_url('**e=code')
    check('wrong code rejected', 'does not match' in g.content())
    g.screenshot(path='/tmp/shagun-shots/gate.png')
    g.fill('[name=code]', code); g.click('button.primary'); g.wait_for_selector('.couple')
    check('right code opens page', 'Riya' in g.content() and 'Home loan' in g.content())
    check('guest page shows no names of givers', 'UTR' not in g.content())

    goal_id = g.get_attribute('input[name=goal_id] >> nth=1', 'value')
    g.goto(f'{B}/w/{slug}/pay?goal_id={goal_id}&amount=5&guest_name=X'); check('amount below minimum refused', 'e=amount' in g.url)
    g.goto(f'{B}/w/{slug}/pay?goal_id={goal_id}&amount=999999&guest_name=X'); check('amount above maximum refused', 'e=amount' in g.url)

    g.goto(f'{B}/w/{slug}')
    g.click('.pick >> nth=1'); g.fill('[name=amount]', '5100'); g.fill('[name=guest_name]', 'Sharma family <b>')
    g.fill('[name=message]', 'Wishing you both a lifetime of happiness')
    g.screenshot(path='/tmp/shagun-shots/guest.png', full_page=True)
    g.click('text=Continue to pay'); g.wait_for_selector('.qr')
    link = g.get_attribute('a.btn.primary', 'href'); print('  upi link:', link)
    check('upi link correct', link.startswith('upi://pay?pa=riya.aman%40okhdfcbank&pn=Riya%20Sharma%20and%20Aman%20Verma&am=5100.00&cu=INR'))
    check('payee name shown', 'Riya Sharma and Aman Verma' in g.inner_text('.payee'))
    g.screenshot(path='/tmp/shagun-shots/pay.png', full_page=True)

    g.eval_on_selector('[name=utr]', 'e => { e.removeAttribute("pattern"); e.removeAttribute("maxlength") }')
    g.fill('[name=utr]', '123'); g.click('text=I have paid'); g.wait_for_url('**e=utr**')
    check('bad UTR refused by server', '12 digits' in g.content())
    g.fill('[name=utr]', '412345678901'); g.click('text=I have paid'); g.wait_for_url('**/gift/**')
    cert_url = g.url
    check('certificate link carries a private key', '?k=' in cert_url)
    check('unverified certificate has watermark', g.locator('.watermark').count() == 1)
    pub = br.new_context().new_page(); pub.goto(cert_url.split('?')[0])
    check('public view hides name and message', 'Sharma' not in pub.content() and 'lifetime' not in pub.content() and 'NOT VERIFIED YET' in pub.inner_text('main').upper())
    pub.goto(cert_url.split('?')[0] + '?k=wrongwrongwrong'); check('wrong key shows public view', 'Sharma' not in pub.content())
    body = g.inner_text('.certificate')
    check('certificate shows guest, goal, couple', all(s in body for s in ['Sharma family <b>', 'Home loan', 'Riya & Aman']))
    check('html in name is escaped', g.locator('.certificate b').count() == 0)
    check('amount hidden by default', '5,100' not in body)
    check('certificate says not verified', 'NOT VERIFIED' in body.upper())
    g.screenshot(path='/tmp/shagun-shots/cert-phone.png', full_page=True)

    # Same UTR again
    g.goto(f'{B}/w/{slug}/pay?goal_id={goal_id}&amount=2100&guest_name=Cheater')
    g.fill('[name=utr]', '412345678901'); g.click('text=I have paid'); g.wait_for_url('**e=used**')
    check('duplicate UTR refused', 'already been used' in g.content())
    # Second gift with amount shown
    g.fill('[name=utr]', '498765432109'); g.check('[name=show_amount]'); g.click('text=I have paid'); g.wait_for_url('**/gift/**')
    check('amount shown when ticked', '2,100' in g.inner_text('.certificate'))
    cert2 = g.url

    # Pending gifts must not count as raised on the public page
    g.goto(f'{B}/w/{slug}'); check('pending gift not shown as raised to guests', '₹5,100' not in g.inner_text('main') and '₹2,100' not in g.inner_text('main'))
    time.sleep(1)
    import email as _e
    from email import policy as _p
    check('couple was emailed about the gift', any('sent a gift' in str(_e.message_from_string(open(f).read(), policy=_p.default)['subject']) for f in sorted(glob.glob('/tmp/shagun-mail/*.eml'))[-6:]))
    # Couple confirms one, rejects the other
    c.goto(B + '/dashboard')
    check('dashboard shows waiting count', '2 waiting' in c.inner_text('main') or '1 waiting' in c.inner_text('main'))
    check('dashboard lists both gifts', c.locator('.gift').count() == 2)
    c.locator('.gift', has_text='Sharma family').locator('text=Received').first.click(); c.wait_for_load_state('networkidle')
    c.locator('.gift', has_text='Cheater').locator('button:has-text("Not received")').click(); c.wait_for_load_state('networkidle')
    c.goto(B + '/dashboard')
    check('confirmed total is 5,100', '₹5,100' in c.inner_text('.stats'))
    check('rejected gift not in progress', '₹5,100 of ₹5,00,000' in c.inner_text('main'))
    c.screenshot(path='/tmp/shagun-shots/dashboard.png', full_page=True)

    g.goto(f'{B}/w/{slug}'); check('confirmed gift now shows on guest page', '₹5,100' in g.inner_text('main'))
    r = c.request.get(B + '/dashboard/export'); csv = r.text()
    check('csv export works and has the gift', r.status == 200 and 'Sharma family' in csv and 'confirmed' in csv)
    check('csv export needs login', br.new_context().request.get(B + '/dashboard/export').status == 401)
    c.goto(B + '/dashboard?s=confirmed'); check('filter shows only confirmed', c.locator('.gift').count() == 1)
    g.goto(cert_url); check('certificate now confirmed', 'CONFIRMED BY THE COUPLE' in g.inner_text('.certificate').upper())
    g.goto(cert2); check('rejected gift has no certificate', g.locator('.certificate').count() == 0 and 'not found' in g.content().lower())

    wide = br.new_context(viewport={'width': 1100, 'height': 800}).new_page()
    wide.goto(cert_url); wide.screenshot(path='/tmp/shagun-shots/cert.png', full_page=True)
    wide.emulate_media(media='print'); wide.pdf(path='/tmp/shagun-shots/cert.pdf', prefer_css_page_size=True)

    # Other couple cannot touch this wedding's gifts; UPI change needs password
    c.goto(B + '/dashboard/settings')
    c.fill('[name=upi_id]', 'thief@ybl'); c.click('text=Save changes'); c.wait_for_url('**e=current**')
    check('UPI change without password refused', 'current password' in c.content().lower())
    c.fill('[name=upi_id]', 'riya.aman@oksbi'); c.fill('[name=current_password]', 'correct-horse-9')
    c.fill('[name=goal_title_1]', ''); c.fill('[name=goal_title_0]', 'Honeymoon in Munnar')
    c.click('text=Save changes'); c.wait_for_url('**/dashboard?e=saved')
    text = c.inner_text('main')
    check('goal with gifts kept, rename works', 'Home loan' in text and 'Honeymoon in Munnar' in text)
    c.goto(B + '/dashboard/settings'); check('UPI updated with password', c.input_value('[name=upi_id]') == 'riya.aman@oksbi')
    c.screenshot(path='/tmp/shagun-shots/settings.png', full_page=True)

    c.click('text=Log out'); c.wait_for_url(B + '/')
    c.goto(B + '/login'); c.fill('[name=email]', 'riya@example.com'); c.fill('[name=password]', 'wrong-pass'); c.click('button.primary'); c.wait_for_url('**e=login')
    check('wrong password refused', 'Wrong email or password' in c.content())
    c.fill('[name=email]', 'riya@example.com'); c.fill('[name=password]', 'correct-horse-9'); c.click('button.primary'); c.wait_for_url('**/dashboard')
    check('login works', 'Riya' in c.content())

    # Delete account
    c.goto(B + '/dashboard/settings'); c.locator('.danger [name=current_password]').fill('correct-horse-9'); c.locator('.danger [name=confirm]').fill('delete')
    c.locator('.danger button').click(); c.wait_for_url(B + '/')
    c.goto(B + '/login'); c.fill('[name=email]', 'riya@example.com'); c.fill('[name=password]', 'correct-horse-9'); c.click('button.primary'); c.wait_for_url('**e=login')
    check('deleted account cannot log in', 'Wrong email' in c.content())
    g.goto(f'{B}/w/{slug}'); check('deleted wedding page is gone', g.url.endswith(slug) and 'Riya' not in g.content())
    print('console errors:', errs)
    br.close()

bad = [n for n, v in ok if not v]
print(f'{len(ok) - len(bad)}/{len(ok)} passed'); sys.exit(1 if bad else 0)
