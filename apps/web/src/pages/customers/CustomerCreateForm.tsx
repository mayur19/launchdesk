import { createCustomerRequestSchema, type CustomerAccount } from '@launchdesk/shared';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { createCustomer } from './customers.api';

type FieldName = 'name' | 'industry' | 'websiteText' | 'primaryContact';
type FormValues = Readonly<Record<FieldName, string>>;
type FieldErrors = Partial<Record<FieldName, string>>;

const EMPTY: FormValues = { name: '', industry: '', websiteText: '', primaryContact: '' };

const FIELDS: readonly { readonly name: FieldName; readonly label: string }[] = [
  { name: 'name', label: 'Customer name' },
  { name: 'industry', label: 'Industry' },
  { name: 'websiteText', label: 'Website' },
  { name: 'primaryContact', label: 'Primary contact' },
];

function issuesToErrors(issues: readonly { path: string; message: string }[]): FieldErrors {
  return Object.fromEntries(issues.map((issue) => [issue.path, issue.message]));
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) return error.message;
  if (error instanceof ApiError && error.status === 403) {
    return 'Only provider admins can create customer accounts.';
  }
  return 'Could not create the customer account. Try again.';
}

export interface CustomerCreateFormProps {
  readonly onCreated: (customer: CustomerAccount) => void;
}

/** Admin-only create form (FR-01). Validates with the shared schema, then the API re-validates. */
export function CustomerCreateForm({ onCreated }: CustomerCreateFormProps) {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = createCustomerRequestSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(
        issuesToErrors(
          parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        ),
      );
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      onCreated(await createCustomer(parsed.data));
      setValues(EMPTY);
    } catch (error) {
      if (error instanceof ApiError && Array.isArray(error.body.details)) {
        setFieldErrors(issuesToErrors(error.body.details as { path: string; message: string }[]));
      }
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card" onSubmit={onSubmit} noValidate aria-labelledby="new-customer-heading">
      <h2 id="new-customer-heading">New customer account</h2>
      <div className="form-grid">
        {FIELDS.map((field) => (
          <label key={field.name} className="field">
            <span>{field.label}</span>
            <input
              name={field.name}
              value={values[field.name]}
              aria-invalid={fieldErrors[field.name] ? true : undefined}
              onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
            />
            {fieldErrors[field.name] ? (
              <span className="field__error">{fieldErrors[field.name]}</span>
            ) : null}
          </label>
        ))}
      </div>
      {formError ? (
        <p className="alert alert--error" role="alert">
          {formError}
        </p>
      ) : null}
      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create customer'}
      </button>
    </form>
  );
}
