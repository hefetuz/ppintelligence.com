import { siteHref } from './links';
import { HairlineFigure } from './hairline-figure';
import { MessageSquareText, Layers3 } from '@/components/sharp-icons';
import { pageCopy } from './content';

const STEPS = [
  {
    title: 'Frame the question.',
    label: 'Context',
    figure: 'question-folio' as const,
    note: 'Priorities, constraints and the decision at hand.',
  },
  {
    title: 'Examine the evidence.',
    label: 'Analysis',
    figure: 'evidence-bench' as const,
    note: 'Evidence, assumptions and the economic context.',
  },
  {
    title: 'Discuss the way forward.',
    label: 'Decision',
    figure: 'option-selector' as const,
    note: 'Clear options, trade-offs and practical next steps.',
  },
] as const;

export function CompanyHowWeWork() {
  const copy = pageCopy.company;
  const steps = STEPS.map((step, index) => ({
    ...step,
    ...copy?.processSteps?.[index],
  }));
  return (
    <div className="work-phases" id="how-we-work">
      <div className="work-phases__top">
        <header className="work-phases__heading">
          <p>How it works</p>
          <h2 id="how-we-work-heading">
            {copy?.processHeading ?? 'From question to decision.'}
          </h2>
          <a className="work-phases__cta" href={siteHref('/contact/')}>
            Book a call
          </a>
        </header>
        <ol className="work-phases__stages" aria-label="Our consulting process">
          {steps.map((step) => (
            <li className="work-phases__stage" key={step.label}>
              <p>{step.label}</p>
              <HairlineFigure
                name={step.figure}
                label={step.title}
                caption={step.label}
                className="work-phases__drawing"
              />
            </li>
          ))}
        </ol>
      </div>
      <div className="work-phases__details">
        <div>
          <h3>
            <MessageSquareText size={20} aria-hidden="true" />
            {copy?.processDetails?.[0]?.title ?? 'Start with a conversation.'}
          </h3>
          <p>
            {copy?.processDetails?.[0]?.body ??
              'Bring the decision you are facing. We discuss your business context, priorities and where a fresh perspective would help.'}
          </p>
        </div>
        <div>
          <h3>
            <Layers3 size={20} aria-hidden="true" />
            {copy?.processDetails?.[1]?.title ?? 'Agree on the work.'}
          </h3>
          <p>
            {copy?.processDetails?.[1]?.body ??
              'Define the scope together. We agree on the evidence, analysis and deliverables, then discuss the findings and next steps.'}
          </p>
        </div>
      </div>
    </div>
  );
}
