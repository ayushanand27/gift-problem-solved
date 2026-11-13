import QRCode from 'qrcode';

// Standard UPI payment link. Any UPI app (GPay, PhonePe, Paytm, BHIM) understands it.
// The money goes straight from the guest's bank to the couple's bank. This site never holds it.
export function upiLink({ upiId, payeeName, amount, note }) {
  const parts = [
    `pa=${encodeURIComponent(upiId)}`,
    `pn=${encodeURIComponent(payeeName)}`,
    `am=${encodeURIComponent(Number(amount).toFixed(2))}`,
    'cu=INR',
    `tn=${encodeURIComponent(note)}`,
  ];
  return `upi://pay?${parts.join('&')}`;
}

export function qrDataUrl(text, size = 320) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 2, width: size });
}

// Bank and app handles that NPCI hands out. An ID ending in anything else is not rejected
// (the list changes), but the couple has to say they tested it.
const KNOWN_HANDLES = new Set(`ybl ibl axl oksbi okhdfcbank okicici okaxis paytm ptyes pthdfc ptsbi ptaxis upi apl sbi
hdfcbank icici axisbank kotak okbizaxis pnb boi cnrb barodampay aubank idfcfirst idfcbank indus yesbank fbl federal
rbl ikwik postbank psb unionbank uboi canarabank centralbank dbs jupiter slice fam freecharge airtel airtelpaymentsbank
jio abfspay waicici wahdfcbank waaxis wasbi allbank andb cbin cub dlb equitas hsbc iob kvb mahb tjsb tmb uco utbi ubi
ezeepay naviaxis navi superyes timecosmos niyoicici`.split(/\s+/));

export function hasKnownHandle(upiId) {
  return KNOWN_HANDLES.has(String(upiId).split('@')[1] ?? '');
}
