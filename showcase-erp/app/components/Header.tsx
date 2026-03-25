import Image from "next/image";
import Link from "next/link";
import { MdAccountCircle } from "react-icons/md";

export default function Header() {
  return (
    <header className="navbar bg-base-200 shadow-sm px-4">
      <div className="flex-none mr-4">
        <Link href="/">
          <Image
            src="/logo-thywissen.svg"
            alt="Logo"
            width={40}
            height={33}
            priority
          />
        </Link>
      </div>
      <div className="flex-1 justify-center">
        <span className="text-lg font-semibold text-primary">
          Öl &amp; Proteinwerke Neuss
        </span>
      </div>
      <div className="flex-none">
        <Link href="/sign-out" className="btn btn-ghost btn-circle">
          <MdAccountCircle className="size-7" />
        </Link>
      </div>
    </header>
  );
}
