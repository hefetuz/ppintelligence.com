import HeroSection from './site/hero-section';
import HomeSections from './site/home-sections';
import { pageMeta } from './site/content';

export const metadata = pageMeta['/'];
export default function Home() {
  return <div className="silver-landing"><HeroSection><HomeSections /></HeroSection></div>;
}
