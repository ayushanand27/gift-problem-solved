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
