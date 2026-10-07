import { HeroSection } from './HeroSection'
import { CoupleSection } from './CoupleSection'
import { StorySection } from './StorySection'
import { GallerySection } from './GallerySection'
import { EventSection, ScheduleSection } from './EventSection'
import { CountdownSection } from './CountdownSection'
import { RsvpSection } from './RsvpSection'
import { MusicSection, FaqSection } from './MusicFaqSection'
import { GiftSection, AccommodationSection, DresscodeSection } from './InfoSections'
import { GuestbookSection } from './GuestbookSection'
import { TextSection, DividerSection, FooterSection } from './MiscSections'
import type { SectionComponentProps } from '../render/primitives'

export const sectionComponents: Record<string, React.ComponentType<SectionComponentProps>> = {
  hero: HeroSection,
  couple: CoupleSection,
  story: StorySection,
  gallery: GallerySection,
  event: EventSection,
  schedule: ScheduleSection,
  countdown: CountdownSection,
  rsvp: RsvpSection,
  music: MusicSection,
  faq: FaqSection,
  gift: GiftSection,
  accommodation: AccommodationSection,
  dresscode: DresscodeSection,
  guestbook: GuestbookSection,
  text: TextSection,
  divider: DividerSection,
  footer: FooterSection,
}

export const sectionRegistry = Object.fromEntries(
  Object.entries(sectionComponents).map(([type, component]) => [type, { component }])
)
