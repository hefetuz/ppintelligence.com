'use client';

import { Accordion } from '@base-ui/react/accordion';
import './contact-faq.css';
import { pageCopy } from './content';

const questions = [
  [
    'Who will I speak with?',
    'Your introductory call is with Deniz Tudor, founder of Pretty Penny Intelligence.',
  ],
  [
    'How long is the introductory call?',
    'The call lasts 15 minutes and there is no fee.',
  ],
  [
    'What should I prepare?',
    'A little context about your business and the decision you are considering. No presentation is needed.',
  ],
  [
    'What happens after the conversation?',
    'If further work would be useful, we discuss the question, information and scope before an engagement begins.',
  ],
];

export function ContactFaq() {
  return (
    <section className="contact-faq" aria-labelledby="contact-questions">
      <header>
        <p className="contact-editorial__eyebrow">FAQ</p>
        <h2 id="contact-questions">
          Questions
          <br />
          before we talk.
        </h2>
      </header>
      <Accordion.Root
        defaultValue={[0]}
        multiple={false}
        className="contact-faq__list"
      >
        {(pageCopy.contact?.faq?.map(item => [item.question,item.answer]) ?? questions).map(([question, answer], index) => (
          <Accordion.Item
            value={index}
            key={question}
            className="contact-faq__item"
          >
            <Accordion.Header className="contact-faq__heading">
              <Accordion.Trigger className="contact-faq__trigger">
                <span className="contact-faq__number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{question}</span>
                <span className="contact-faq__toggle" aria-hidden="true" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="contact-faq__panel">
              <p>{answer}</p>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}
