import 'katex/dist/katex.min.css'
import { Saltwake } from '@/components/landing/saltwake'
import { Story } from '@/components/landing/story'
import { SiteFooter } from '@/components/site-footer'
import './saltwake.css'

export default function Landing() {
  return (
    <>
      <div className="swp">
        <Saltwake />
        <Story />
      </div>
      <SiteFooter />
    </>
  )
}
