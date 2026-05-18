import TextType from '../components/TextType'
import SitemapShowcase from '../components/SitemapShowcase'
import SectionThreeTransition from '../components/SectionThreeTransition'
import TheProcess from '../components/TheProcess'
import Link from 'next/link'

const Claude = () => (
  <svg fill="currentColor" fillRule="evenodd" height="24" style={{ flex: "none", lineHeight: 1 }} viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" aria-label="Claude">
    <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
  </svg>
)
import { File, Users, Code } from "lucide-react"

export default function Home() {
  return (
    <>
      <section className='flex flex-col items-center min-h-[60vw]'>
        <svg
          width="100%"
          viewBox="0 0 1443 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-0 left-0 -z-10 w-screen h-auto mb-8"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="bg-shape">
              <path d="M813.408 959.766C868.674 1122.29 1137.24 1128.51 1197.7 959.766C1231.56 1059.34 1345.49 1100.24 1442.57 1078.18V0H0V1049.92C30.629 1029.35 55.6064 999.382 69.8026 959.766C125.068 1122.29 381.137 1128.51 441.605 959.766C496.871 1122.29 752.94 1128.51 813.408 959.766Z" />
            </clipPath>
          </defs>
          <image
            href="/bg.png"
            width="1443"
            height="900"
            clipPath="url(#bg-shape)"
            preserveAspectRatio="xMidYMid slice"
          />
        </svg>
        <h1 className="text-[55.55px] text-white whitespace-nowrap font-heading text-center w-full mb-4">
          <span className=''>Let your agent handle the{" "}</span>
          <TextType
            as="span"
            text={["Sitemap", "Wireframe"]}
            typingSpeed={75}
            pauseDuration={3000}
            showCursor
            cursorCharacter="_"
            deletingSpeed={50}
            cursorBlinkDuration={0.5}
          />
        </h1>
        <p className="text-center">Have your Openclaw, Claude or Codex agent create sitemaps and wireframes and have them visualized in seconds.</p>
        <div className='mt-55 w-7/12 h-100 bg-red-200'>

        </div>
      </section>
      <SitemapShowcase />
      <SectionThreeTransition />
      <section className='pt-80 relative flex flex-col gap-12 items-center mb-35'>
        <h2 className='heading-2 text-center'>The Process</h2>
        <TheProcess />
      </section>
      <section className='bg-white/90 min-h-12 w-full flex flex-col items-center'>
        <h2 className='heading-2'>Start building right away</h2>
        <p className='text-[hsl(0,0%,10%)] text-[23px]'>No account needed.</p>
        <ul className='mt-10 mb-10 flex flex-col gap-3 text-[30px]'>
          <li className="flex flex-row gap-2 items-center">
            <File />
            <p>Visual sitemap + wireframe builder</p>
          </li>
          <li className="flex flex-row gap-2 items-center">
            <Users />
            <p>Live collaboration with your team</p>
          </li>
          <li className="flex flex-row gap-2 items-center">
            <Claude />
            <p>Integrated AI with 100 monthly credits for free</p>
          </li>
          <li className="flex flex-row gap-2 items-center">
            <Code />
            <p>API + MCP-access to Layoutr</p>
          </li>
        </ul>
        <div className='flex gap-4'>
          <Link className='bg-accent px-4 py-2 rounded-full'
            href="/dashboard"
          >
            <p className='text-[28px]'>Start building</p>
          </Link>
          <Link className='border border-black/90 px-4 py-2 rounded-full text-[28px]'
            href="/docs"
          >
            <p>View docs</p>
          </Link>
        </div>
      </section>
    </>
  );
}
