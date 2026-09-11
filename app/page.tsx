'use client'

import { useEffect, useMemo, useState } from 'react'

type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  age: string
  gender: string
  pronouns: string
  discord: string
  city: string
  country: string
  department: string
  institutions: { institution: string; startDate: string; endDate: string; grade: string }[]
  qualifications: { institution: string; startDate: string; endDate: string; grade: string }[]
  experiences: { organisation: string; startDate: string; endDate: string; title: string; link: string }[]
  experienceQualifications: { organisation: string; startDate: string; endDate: string; grade: string }[]
  languages: { testName: string; startDate: string; endDate: string; grade: string }[]
  waiver: string
  motivation: string
  goals: string
  acknowledgement: boolean
}

const emptyData: FormData = {
  firstName: '', lastName: '', age: '', gender: '', pronouns: '', email: '', phone: '', discord: '', city: '', country: '', department: '',
  institutions: [{ institution: '', startDate: '', endDate: '', grade: '' }],
  qualifications: [{ institution: '', startDate: '', endDate: '', grade: '' }],
  experiences: [{ organisation: '', startDate: '', endDate: '', title: '', link: '' }],
  experienceQualifications: [{ organisation: '', startDate: '', endDate: '', grade: '' }],
  languages: [{ testName: '', startDate: '', endDate: '', grade: '' }], waiver: '',
  motivation: '', goals: '', acknowledgement: false,
}

const steps = [
  { title: 'DEPARTMENT', hint: '' },
  { title: 'Personal details', hint: 'About you' },
  { title: 'Academic background', hint: 'Your education' },
  { title: 'Experience', hint: 'Your experience' },
  { title: 'English Language Proficiency', hint: 'English language tests' },
  { title: 'Short answer', hint: 'Your motivation' },
  { title: 'Review & submit', hint: 'Final checks' },
]

const endpoint = 'https://script.google.com/macros/s/AKfycbyM68mCN1wmlUgDKLHDDsGRIiXqrC8uRDIQuUM9b34hH5k5ixJqZjdXXR3Y7TPHNHus0w/exec'
const cookieName = 'zo-application-draft'

function Field({ label, name, value, onChange, required, type = 'text', placeholder }: { label: string; name: string; value: string; onChange: (name: string, value: string) => void; required?: boolean; type?: string; placeholder?: string }) {
  return <div className="form-field"><label htmlFor={name} className="form-label">{label} {required && <span className="required">*</span>}</label><input id={name} name={name} type={type} value={value} onChange={(e) => onChange(name, e.target.value)} className="form-control" placeholder={placeholder} required={required} /></div>
}

export default function Page() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(emptyData)
  const [errors, setErrors] = useState<string[]>([])
  const [saveState, setSaveState] = useState('Saved locally')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const match = document.cookie.split('; ').find((row) => row.startsWith(`${cookieName}=`))
    if (match) {
      try { const saved = JSON.parse(decodeURIComponent(match.split('=').slice(1).join('='))); setData({ ...emptyData, ...saved }) ; setStep(saved.step || 0) } catch { /* ignore malformed draft */ }
    }
  }, [])

  useEffect(() => {
    const payload = encodeURIComponent(JSON.stringify({ ...data, step }))
    document.cookie = `${cookieName}=${payload}; max-age=2592000; path=/; SameSite=Lax`
    setSaveState('Saved locally')
  }, [data, step])

  const update = (name: string, value: string) => { setData((current) => ({ ...current, [name]: value })); setSaveState('Saving…') }
  const isStepStarted = (index: number) => {
    if (index === 0) return Boolean(data.department.trim())
    if (index === 1) return Boolean(data.firstName.trim() || data.lastName.trim() || data.email.trim() || data.phone.trim() || data.age.trim() || data.gender.trim() || data.pronouns.trim() || data.discord.trim() || data.city.trim() || data.country.trim())
    if (index === 2) return [...data.institutions, ...data.qualifications].some((entry) => Object.values(entry).some((value) => Boolean(value)))
    if (index === 3) return [...data.experiences, ...data.experienceQualifications].some((entry) => Object.values(entry).some((value) => Boolean(value)))
    if (index === 4) return Boolean(data.waiver.trim()) || data.languages.some((entry) => Object.values(entry).some((value) => Boolean(value)))
    if (index === 5) return Boolean(data.motivation.trim() || data.goals.trim())
    return Boolean(data.acknowledgement)
  }
  const isStepComplete = (index: number) => {
    if (index === 0) return Boolean(data.department.trim())
    if (index === 1) return Boolean(data.firstName.trim() && data.lastName.trim() && data.email.trim() && data.phone.trim())
    if (index === 2) return data.institutions.some((entry) => Object.values(entry).some(Boolean)) && data.qualifications.some((entry) => Object.values(entry).some(Boolean))
    if (index === 3) return data.experiences.some((entry) => Object.values(entry).some(Boolean))
    if (index === 4) return data.waiver === 'Yes' || (data.waiver === 'No' && data.languages.some((entry) => Object.values(entry).some(Boolean)))
    if (index === 5) return Boolean(data.motivation.trim())
    return Boolean(data.acknowledgement)
  }
  const calculateProgress = () => {
    const progressMap = [5, 25, 13, 13, 13, 26, 5]
    return progressMap.reduce((total, weight, index) => total + (isStepComplete(index) ? weight : 0), 0)
  }
  const progress = Math.min(100, Math.max(0, calculateProgress()))

  const validate = () => {
    const next: string[] = []
    if (step === 6) {
      if (!data.firstName.trim()) next.push('Please enter your first name.')
      if (!data.lastName.trim()) next.push('Please enter your last name.')
      if (!data.age.trim()) next.push('Please enter your age.')
      if (!data.gender.trim()) next.push('Please enter your gender.')
      if (!data.pronouns.trim()) next.push('Please enter your pronouns.')
      if (!data.email.trim() || !/^\S+@\S+\.\S+$/.test(data.email)) next.push('Please enter a valid email address.')
      if (!data.phone.trim()) next.push('Please enter your phone number.')
      if (!data.discord.trim()) next.push('Please enter your Discord username.')
      if (!data.city.trim() || !data.country.trim()) next.push('Please enter your city and country.')
      if (!data.acknowledgement) next.push('Please confirm the acknowledgement before submitting.')
    }
    setErrors(next); return next.length === 0
  }
  const next = () => setStep((value) => Math.min(value + 1, steps.length - 1))
  const clearDraft = () => { document.cookie = `${cookieName}=; max-age=0; path=/`; setData(emptyData); setStep(0); setSubmitted(false); setErrors([]) }

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const body = new URLSearchParams({ ...data, institutions: JSON.stringify(data.institutions), qualifications: JSON.stringify(data.qualifications), experiences: JSON.stringify(data.experiences), experienceQualifications: JSON.stringify(data.experienceQualifications), languages: JSON.stringify(data.languages), acknowledgement: String(data.acknowledgement) }).toString()
      await fetch(endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
      setSubmitted(true); document.cookie = `${cookieName}=; max-age=0; path=/`
    } catch { setErrors(['We could not send your application. Please try again.']) } finally { setSubmitting(false) }
  }

  const addRow = (key: 'institutions' | 'qualifications' | 'experiences' | 'experienceQualifications' | 'languages') => setData((current) => ({ ...current, [key]: [...current[key], key === 'institutions' || key === 'qualifications' ? { institution: '', startDate: '', endDate: '', grade: '' } : key === 'experiences' ? { organisation: '', startDate: '', endDate: '', title: '', link: '' } : key === 'experienceQualifications' ? { organisation: '', startDate: '', endDate: '', grade: '' } : { testName: '', startDate: '', endDate: '', grade: '' }] }))
  const removeRow = (key: 'institutions' | 'qualifications' | 'experiences' | 'experienceQualifications' | 'languages', index: number) => setData((current) => ({ ...current, [key]: current[key].filter((_, i) => i !== index) }))

  const summary = useMemo(() => `${data.firstName} ${data.lastName}`.trim() || 'Your application', [data.firstName, data.lastName])

  if (submitted) return <main className="success-page"><div className="success-card"><div className="success-mark">✓</div><p className="eyebrow">Application received</p><h1>Thank you, {data.firstName || 'applicant'}.</h1><p>Your application has been submitted successfully. We will be in touch using the email address you provided.</p><button className="btn btn-primary" onClick={clearDraft}>Start a new application</button></div></main>

  return <main className="app-shell"><header className="topbar"><img className="brand-logo" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/web-app-manifest-192x192-qkGxmODEvXhuTMBUhEdFEWh9eMlE25.png" alt="Zo! Initiative" /><button className="clear-button" onClick={clearDraft}>Clear</button></header>
    <div className="mobile-progress"><div><span>Step {step + 1} of {steps.length}</span><strong>{steps[step].title}</strong></div><div className="progress"><div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div></div>
    <div className="form-layout"><aside className="sidebar"><nav aria-label="Application sections">{steps.map((item, index) => <button key={item.title} className={`step-link ${index === step && !isStepComplete(index) ? 'active' : ''} ${isStepComplete(index) ? 'complete' : ''} ${!isStepComplete(index) && isStepStarted(index) ? 'in-progress' : ''}`} onClick={() => setStep(index)}><span className={`step-number ${index === step && !isStepComplete(index) ? 'step-number-active' : ''} ${isStepComplete(index) ? 'step-number-complete' : ''} ${!isStepComplete(index) && isStepStarted(index) ? 'step-number-in-progress' : ''}`}>{isStepComplete(index) ? <i className="fas fa-check" aria-hidden="true" /> : isStepStarted(index) ? '' : `0${index + 1}`}</span><span><strong>{item.title}</strong></span></button>)}</nav></aside>
      <section className="content"><div className="content-inner"><div className="desktop-progress"><div className="progress-label"><span>Application progress</span><strong>{progress}% complete</strong></div><div className="progress"><div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div></div><div className="section-heading"><p className="eyebrow">{String(step + 1).padStart(2, '0')}</p><h1>{steps[step].title}</h1></div>{errors.length > 0 && <div className="alert alert-danger" role="alert"><strong>Please check the following:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        {step === 0 && <DepartmentSelector value={data.department} onChange={(value) => update('department', value)} />}
        <div className="form-card">{step !== 0 && <>
          {step === 1 && <><div className="form-grid"><Field label="First name" name="firstName" value={data.firstName} onChange={update} required placeholder="e.g. Alex" /><Field label="Last name" name="lastName" value={data.lastName} onChange={update} required placeholder="e.g. Johnson" /><Field label="Email address" name="email" type="email" value={data.email} onChange={update} required placeholder="you@example.com" /><Field label="Phone number" name="phone" type="tel" value={data.phone} onChange={update} placeholder="+44 7700 900000" /><Field label="Age" name="age" type="number" value={data.age} onChange={update} required placeholder="e.g. 18" /><Field label="Gender" name="gender" value={data.gender} onChange={update} required /><Field label="Pronouns" name="pronouns" value={data.pronouns} onChange={update} required placeholder="e.g. they/them" /><Field label="Discord" name="discord" value={data.discord} onChange={update} required placeholder="username" /></div><div className="form-grid"><Field label="City" name="city" value={data.city} onChange={update} required /><Field label="Country" name="country" value={data.country} onChange={update} required placeholder="e.g. United Kingdom" /></div></>}
          {step === 2 && <div className="subsections"><Repeatable title="Institution" description="Add an institution." rows={data.institutions} keyName="institutions" onAdd={addRow} onRemove={removeRow} render={(row, index) => <EntryFields row={row} index={index} keyName="institutions" setData={setData} fields={['institution', 'startDate', 'endDate', 'grade']} labels={['Institution Name', 'Start Date', 'End Date', 'Grade']} />} /><Repeatable title="Qualification" description="Add up to five qualifications." rows={data.qualifications} keyName="qualifications" onAdd={addRow} onRemove={removeRow} render={(row, index) => <EntryFields row={row} index={index} keyName="qualifications" setData={setData} fields={['institution', 'startDate', 'endDate', 'grade']} labels={['Institution Name', 'Start Date', 'End Date', 'Grade']} />} /></div>}
          {step === 3 && <div className="subsections"><Repeatable title="Experience" description="Add up to five experiences." rows={data.experiences} keyName="experiences" onAdd={addRow} onRemove={removeRow} render={(row, index) => <EntryFields row={row} index={index} keyName="experiences" setData={setData} fields={['organisation', 'startDate', 'endDate', 'title', 'link']} labels={['Organisation Name', 'Start Date', 'End Date', 'Title', 'Link']} />} /><Repeatable title="Qualification" description="Add up to five experience qualifications." rows={data.experienceQualifications} keyName="experienceQualifications" onAdd={addRow} onRemove={removeRow} render={(row, index) => <EntryFields row={row} index={index} keyName="experienceQualifications" setData={setData} fields={['organisation', 'startDate', 'endDate', 'grade']} labels={['Organisation Name', 'Start Date', 'End Date', 'Grade']} />} /></div>}
          {step === 4 && <><div className="waiver-question"><p>Do you qualify for a waiver?</p><div className="waiver-options"><label><input type="radio" name="waiver" value="Yes" checked={data.waiver === 'Yes'} onChange={(e) => update('waiver', e.target.value)} /> Yes</label><label><input type="radio" name="waiver" value="No" checked={data.waiver === 'No'} onChange={(e) => update('waiver', e.target.value)} /> No</label></div></div><Repeatable className="english-repeat" title="English Language Proficiency" description={<>Add up to five English language tests.</>} rows={data.languages} keyName="languages" onAdd={addRow} onRemove={removeRow} render={(row, index) => <EntryFields row={row} index={index} keyName="languages" setData={setData} fields={['testName', 'startDate', 'endDate', 'grade']} labels={['Test Name', 'Start Date', 'End Date', 'Grade']} />} /></>}
          {step === 5 && <><div className="form-field"><label className="form-label" htmlFor="motivation">Why are you applying? <span className="required">*</span></label><textarea id="motivation" className="form-control large-textarea" rows={7} value={data.motivation} onChange={(e) => update('motivation', e.target.value)} placeholder="Share what motivates you and what you hope to learn..." /><div className="character-count">{data.motivation.length} / 1,000 characters</div></div><div className="form-field"><label className="form-label" htmlFor="goals">What are your goals?</label><textarea id="goals" className="form-control" rows={5} value={data.goals} onChange={(e) => update('goals', e.target.value)} placeholder="Tell us what you would like to achieve next." /></div></>}
          {step === 6 && <><div className="review-grid"><Review label="Department" value={data.department || 'Not provided'} /><Review label="Name" value={summary} /><Review label="Email" value={data.email || 'Not provided'} /></div><p className="submission-note">Please send your documents under the email address provided to <a href="mailto:apply@zoinitiative.com">apply@zoinitiative.com</a>.</p><div className="acknowledgement"><input id="acknowledgement" type="checkbox" checked={data.acknowledgement} onChange={(e) => setData((d) => ({ ...d, acknowledgement: e.target.checked }))} /><label htmlFor="acknowledgement">I confirm that the information in this application is accurate and complete. I understand that submitting this form does not guarantee acceptance.</label></div></>}
        </>}</div><div className="form-actions">{step > 0 ? <button className="btn btn-outline-secondary back-button" onClick={() => setStep((value) => value - 1)}>Back</button> : <span />}{step < steps.length - 1 ? <button className="btn btn-primary continue-button pill-button" onClick={next}>Continue</button> : <button className="btn btn-primary continue-button pill-button" onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit application'}</button>}</div></div></section></div></main>
}

function DepartmentSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) { const departments = ['Creative Tech', 'Research', 'Marketing', 'Community']; return <div className="department-selector"><h3>Select a department</h3><div className="department-list">{departments.map((department) => <button type="button" key={department} className={`department-option ${value === department ? 'selected' : ''}`} onClick={() => onChange(department)}>{department}<span className="department-arrow" aria-hidden="true"><i className="fas fa-chevron-right"></i></span></button>)}</div></div> }
function EntryFields({ row, index, keyName, setData, fields, labels }: { row: Record<string, string>; index: number; keyName: 'institutions' | 'qualifications' | 'experiences' | 'experienceQualifications' | 'languages'; setData: React.Dispatch<React.SetStateAction<FormData>>; fields: string[]; labels: string[] }) { return <div className="repeat-grid">{fields.map((field, i) => <Field key={field} label={labels[i]} name={`${keyName}-${field}-${index}`} value={row[field] || ''} onChange={(_, value) => setData((d) => ({ ...d, [keyName]: d[keyName].map((item: Record<string, string>, rowIndex: number) => rowIndex === index ? { ...item, [field]: value } : item) }))} />)}</div> }
function Repeatable({ className = '', title, description, rows, keyName, onAdd, onRemove, render }: { className?: string; title: string; description: React.ReactNode; rows: unknown[]; keyName: 'institutions' | 'qualifications' | 'experiences' | 'experienceQualifications' | 'languages'; onAdd: (key: 'institutions' | 'qualifications' | 'experiences' | 'experienceQualifications' | 'languages') => void; onRemove: (key: 'institutions' | 'qualifications' | 'experiences' | 'experienceQualifications' | 'languages', index: number) => void; render: (row: any, index: number) => React.ReactNode }) { return <div className={className}><div className="repeat-heading"><div><h3>{title}</h3><p>{description}</p></div><span className="counter">{rows.length} / 5</span></div>{rows.map((row, index) => <div className="repeat-block" key={index}><div className="repeat-block-top"><span>Entry {index + 1}</span>{rows.length > 1 && <button type="button" className="remove-button" onClick={() => onRemove(keyName, index)}>Remove</button>}</div>{render(row, index)}</div>)}{rows.length < 5 && <button type="button" className="add-button" onClick={() => onAdd(keyName)}>+ Add another</button>}</div> }
function Review({ label, value }: { label: string; value: string }) { return <div className="review-item"><span>{label}</span><strong>{value}</strong></div> }
