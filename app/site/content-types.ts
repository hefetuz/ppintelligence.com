export type TopicId = 'strategy' | 'risk' | 'economics';
export type BaseSitePath =
  | '/'
  | '/expertise/'
  | '/about/'
  | '/insights/'
  | '/contact/';
export type Publication = {
  status: 'draft' | 'published';
  companyApproved: boolean;
  internalNotes?: string;
};
export type Topic = {
  id: TopicId;
  number: string;
  name: string;
  word: string;
  lead: string;
  summary: string;
  question: string;
  figure:
    | 'compass'
    | 'balance'
    | 'conveyor'
    | 'value-iris'
    | 'perspective-sculpture'
    | 'possibility-tangram'
    | 'possibility-kaleidoscope';
};
export type Expertise = Publication & {
  id: TopicId;
  slug?: string;
  name: string;
  summary: string;
  body: string[];
  scope: string[];
};
export type Insight = Publication & {
  id: string;
  type: 'article' | 'talk' | 'podcast';
  title: string;
  summary: string;
  topics: TopicId[];
  date?: string;
  order?: number;
  attribution: { name: string; role: 'author' | 'speaker' };
  host?: string;
  sourceUrl: string;
  sourceVerified: boolean;
  reuseApproved: boolean;
  featured?: boolean;
  destination:
    | { kind: 'local'; slug: string; body: string[] }
    | { kind: 'external'; url: string };
  media?: { src: string; alt: string; reuseApproved: boolean };
};
export type TeamMember = Publication & {
  id: string;
  name: string;
  role: string;
  specialty: string;
  bio?: string;
  image?: { src: string; alt: string; reuseApproved: boolean };
};
export type EngagementFormat = Publication & {
  id: string;
  title: string;
  description: string;
};
export type ApprovedImage = {
  src: string;
  alt: string;
  reuseApproved: boolean;
};
export type Founder = Publication & {
  name: string;
  role: string;
  intro: string;
  bio: string[];
  facts: string[];
  career?: string[];
  shortBio?: string;
  credentials?: { qualification: string; institution: string }[];
  portrait?: ApprovedImage;
};
export type CompanyLogo = Publication & {
  id: string;
  name: string;
  relationship: 'client' | 'previous-employer';
  sourceVerified: boolean;
  image: ApprovedImage;
};
export type ExternalReference = Publication & {
  id: string;
  label: string;
  description: string;
  url: string;
  sourceVerified: boolean;
};
export type PodcastReference = ExternalReference & { type: 'podcast' };
export type Contact = {
  bookingUrl: string;
  companyLinkedIn: string;
  durationMinutes: number;
  participant: string;
  mode: string;
  email?: string;
  emailApproved?: boolean;
};
export type PublicFounder = Omit<Founder, keyof Publication | 'portrait'> & {
  portrait?: { src: string; alt: string };
};
export type PublicCompanyLogo = Pick<
  CompanyLogo,
  'id' | 'name' | 'relationship'
> & { image: { src: string; alt: string } };
export type PublicReference = Pick<
  ExternalReference,
  'id' | 'label' | 'description' | 'url'
>;
export type PublicPodcastReference = PublicReference & { type: 'podcast' };
export type PublicContact = Omit<Contact, 'emailApproved'>;
export type PublicExpertise = Omit<Expertise, keyof Publication>;
export type PublicInsight = Omit<
  Insight,
  keyof Publication | 'sourceVerified' | 'reuseApproved' | 'media'
> & { media?: { src: string; alt: string } };
export type PublicTeamMember = Omit<TeamMember, keyof Publication | 'image'> & {
  image?: { src: string; alt: string };
};
export type PublicEngagement = Omit<EngagementFormat, keyof Publication>;
export type PageCopy = {
  home?: { heading?: string; description?: string };
  company?: {
    heading?: string;
    description?: string;
    approachHeading?: string;
    approachBody?: string[];
    values?: { title: string; body: string }[];
    processHeading?: string;
    processSteps?: { title: string; note: string }[];
    processDetails?: { title: string; body: string }[];
  };
  contact?: {
    heading?: string;
    description?: string;
    faq?: { question: string; answer: string }[];
  };
};
export type SocialLinks = {
  substack?: string;
  personalLinkedIn?: string;
  x?: string;
  podcast?: string;
};
export type ContentSource = {
  pageCopy?: PageCopy;
  socialLinks?: SocialLinks;
  topics: Topic[];
  expertise: Expertise[];
  insights: Insight[];
  team: TeamMember[];
  engagements: EngagementFormat[];
  contact: Contact;
  founder?: Founder;
  logos?: CompanyLogo[];
  ventures?: ExternalReference[];
  references?: PodcastReference[];
};
export type PublicContent = {
  pageCopy?: PageCopy;
  socialLinks?: SocialLinks;
  topics: Topic[];
  expertise: PublicExpertise[];
  insights: PublicInsight[];
  team: PublicTeamMember[];
  engagements: PublicEngagement[];
  contact: PublicContact;
  founder: PublicFounder | null;
  logos: PublicCompanyLogo[];
  ventures: PublicReference[];
  references: PublicPodcastReference[];
};
