import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ToggleSoundButton from "./toggle-sound-button";
import ToggleThemeButton from "./toogle-theme-button";
import Link from "next/link";
import NavBarDropdownMenu from "./dropdown-menu";
import { Pen, User, CreditCard } from "lucide-react";
import { siGithub } from "simple-icons";

const HomeNavBar = () => {
  return (
    <div className="border-b-8 border-solid p-3 flex items-center justify-center bg-background">
      <div className="w-4/5 flex justify-between items-center relative">
        <div className="flex items-center h-12">
          <Avatar className="w-8 h-8 md:w-12 md:h-12">
            <AvatarImage
              src="images/profile.png"
              alt="sanjay"
              className="object-cover"
            />
            <AvatarFallback className="text-xl">S</AvatarFallback>
          </Avatar>

          <Link
            href="/"
            className="text-3xl hidden lg:inline-flex p-6 cursor-pointer"
          >
            SANJAY
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-4 absolute left-1/2 transform -translate-x-1/2">
          <Button asChild>
            <a
              href="https://blog.sanjayj.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Pen className="mr-2 h-4 w-4" />
              Blog
            </a>
          </Button>

          <Button asChild>
            <a
              href="https://linkedin.com/in/j-sanjay"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <User className="mr-2 h-4 w-4" />
              LinkedIn
            </a>
          </Button>

          <Button asChild>
            <a
              href="https://bit.ly/sanjay-j-resume"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Resume
            </a>
          </Button>

          <Button asChild>
            <a
              href="https://github.com/sanjayj369"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                role="img"
                aria-label="GitHub"
              >
                <path d={siGithub.path} />
              </svg>
              GitHub
            </a>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-2">
            <ToggleSoundButton />
            <ToggleThemeButton />
          </div>

          <div className="md:hidden">
            <NavBarDropdownMenu />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeNavBar;
