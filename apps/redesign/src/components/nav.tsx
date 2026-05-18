import Link from "next/link"
import Image from "next/image"

export default function Nav() {
  return (
    <nav className="flex items-center justify-between w-full px-6 mb-[152px]">
      <Link className="flex items-center gap-3"
        href="/"
      >{/* Icon + Text */}
        <Image
          width={32}
          height={32}
          src="/logo.png"
          alt="Layoutr Logo"
        />
        <div className="text-sm font-medium text-[hsl(0,0%,95%)]">Layoutr</div>
      </Link>

      <div className="flex-1 px-4">{/* Center bar / links */}
        <div className="relative w-full h-[52px] px-4 grid grid-cols-[1fr_auto_1fr] items-center">

          <div aria-hidden className="absolute left-1/2 -translate-x-1/2 h-[55.83%] w-[33.33%]">
            <div className="absolute top-0 h-[99.73%] w-auto rounded-[112.84px] bg-[#ffffff03] shadow-[inset_0.43px_0.43px_6.29px_#ffffff4c,inset_-0.43px_-0.87px_0.87px_#ffffff26,inset_0px_0px_4.34px_#ffffff40] flex flex-row items-center justify-center gap-1" >
              <Link
                href="/dashboard"
                aria-label="Dashboard"
                className="appearance-none border-0 outline-none font-sans font-medium text-xs
          tracking-wide text-white/70 box-border flex h-[29px] w-[100px] items-center justify-center
          rounded-[112.84px] bg-transparent cursor-pointer
          hover:text-white hover:bg-white/10
          transition-colors duration-200 ease-in-out
          "
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                aria-label="Profile"
                className="appearance-none border-0 outline-none font-sans font-medium text-xs
          tracking-wide text-white/70 box-border flex h-[29px] w-[100px] items-center justify-center
          rounded-[112.84px] bg-transparent cursor-pointer
          hover:text-white hover:bg-white/10
          transition-colors duration-200 ease-in-out
          "
              >
                Profile
              </Link>
              <Link
                href="/pricing"
                aria-label="Pricing"
                className="appearance-none border-0 outline-none font-sans font-medium text-xs
          tracking-wide text-white/70 box-border flex h-[29px] w-[100px] items-center justify-center
          rounded-[112.84px] bg-transparent cursor-pointer
          hover:text-white hover:bg-white/10
          transition-colors duration-200 ease-in-out
          "
              >
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center">{/* CTA on the right */}
        <button
          type="button"
          aria-label="Get your API key"
          className="appearance-none border-0 outline-none font-sans font-medium text-xs 
          tracking-wide text-neutral-900 box-border flex h-[29px] w-[120px] items-center justify-center overflow-hidden 
          rounded-[112.84px] bg-accent shadow-[inset_-0.43px_-0.87px_0.87px_#ffffff26] cursor-pointer
          hover:bg-secondary
          transition-colors duration-200 ease-in-out
          "
        >
          Get your API key
        </button>
      </div>
    </nav>
  )
}
