import { saveWedding } from '@/app/actions';
import GiftRange from './GiftRange';

const IDEAS = ['Honeymoon', 'Home loan', "First child's education", 'Our first car', 'New home setup'];

// Used both for first-time setup and for editing later.
export default function WeddingForm({ wedding, goals = [] }) {
  const editing = Boolean(wedding);
  return (
    <form action={saveWedding} className="stack">
      <fieldset>
        <legend>The couple</legend>
        <div className="two">
          <label className="field">
            <span>Partner one</span>
            <input name="partner_one" required maxLength={60} defaultValue={wedding?.partner_one} placeholder="Riya" />
          </label>
          <label className="field">
            <span>Partner two</span>
            <input name="partner_two" required maxLength={60} defaultValue={wedding?.partner_two} placeholder="Aman" />
          </label>
        </div>
        <label className="field">
          <span>Wedding date</span>
          <input type="date" name="wedding_date" defaultValue={wedding?.wedding_date || ''} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Where gifts are paid</legend>
        <p className="hint">
          Gifts go straight from the guest&apos;s bank to this UPI ID. We recommend a joint account in both your names.
        </p>
        <label className="field">
          <span>UPI ID</span>
          <input name="upi_id" required maxLength={320} defaultValue={wedding?.upi_id} placeholder="riya.aman@okhdfcbank" autoCapitalize="none" />
        </label>
        <label className="field">
          <span>Type the UPI ID again{editing ? ' (only if you changed it)' : ''}</span>
          <input name="upi_id_confirm" required={!editing} maxLength={320} placeholder="riya.aman@okhdfcbank" autoCapitalize="none" autoComplete="off" />
        </label>
        <label className="check">
          <input type="checkbox" name="upi_checked" />
          <span>I sent ₹1 to this UPI ID from my own phone and it reached us (recommended, and needed if the bank part after @ is unusual).</span>
        </label>
        <label className="field">
          <span>Account holder name, as in the bank</span>
          <input name="payee_name" required maxLength={80} defaultValue={wedding?.payee_name} placeholder="Riya Sharma and Aman Verma" />
        </label>
        {editing && (
          <label className="field">
            <span>Current password (only needed if you change the two fields above)</span>
            <input type="password" name="current_password" autoComplete="current-password" />
          </label>
        )}
      </fieldset>

      <fieldset>
        <legend>Gift range</legend>
        <GiftRange defaultMin={wedding?.min_amount ?? 501} defaultMax={wedding?.max_amount ?? 51000} />
      </fieldset>

      <fieldset>
        <legend>Your goals</legend>
        <p className="hint">Fill in the ones you want. Leave the rest empty.</p>
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="two goal-row" key={i}>
            <input type="hidden" name={`goal_id_${i}`} defaultValue={goals[i]?.id || ''} />
            <label className="field">
              <span>Goal {i + 1}</span>
              <input name={`goal_title_${i}`} maxLength={60} defaultValue={goals[i]?.title} placeholder={IDEAS[i]} required={i === 0} />
            </label>
            <label className="field">
              <span>Target (₹)</span>
              <input type="number" name={`goal_target_${i}`} min={1000} max={100000000} step={1} inputMode="numeric" defaultValue={goals[i]?.target_amount} placeholder="150000" required={i === 0} />
            </label>
          </div>
        ))}
      </fieldset>

      <button type="submit" className="btn primary">{editing ? 'Save changes' : 'Create our gift page'}</button>
    </form>
  );
}
