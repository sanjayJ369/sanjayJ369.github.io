"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Marquee from "@/components/ui/marquee";

const ProfileCard = () => {
  // Marquee items - neobrutalist keywords and skills
  const marqueeItems = [
    "MY",
    "GOOGLE",
    "FILE",
    "SYSTEM",
    "BLOG",
    "IS",
    "OUT!",
    "GIVE",
    "IT",
    "A",
    "READ.",
    ":)",
  ];

  return (
    <div className="relative flex flex-col retro-border bg-background h-auto md:h-[500px] group border-4 border-black dark:border-white">
      <div className="relative w-full h-1/2 overflow-hidden bg-background">
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 6px, 
              rgba(0, 0, 0, 0.1) 6px,
              rgba(0, 0, 0, 0.1) 8px
            )`,
          }}
        />

        <div className="h-full flex items-center">
          <Marquee items={marqueeItems} />
        </div>
      </div>

      <div className="relative h-auto md:h-1/2 p-6 pt-14 flex flex-col justify-center bg-secondary-background border-t-4">
        <div className="absolute -top-12 left-6 z-30 ">
          <Avatar className="w-16 h-16 md:w-24 md:h-24 border-4">
            <AvatarImage
              src="/images/profile.png"
              alt="sanjay"
              className="object-cover"
            />
            <AvatarFallback className="text-xl md:text-2xl font-bold bg-background">
              S
            </AvatarFallback>
          </Avatar>
        </div>
        <h1 className="text-xl md:text-2xl font-bold mb-3 transform -rotate-1">
          Hi...!!!, i am Sanjay
        </h1>
        <p className="text-sm md:text-base leading-relaxed">
          I am a computer science engineering student with an interest in
          programming, particularly web development. Currently, I am pursuing my
          B.E. in Computer Science Engineering, I am currently focused on
          expanding my programming skill set. Beyond coding, I like to do 3D art
          and also play chess I invite you to explore my work
        </p>
      </div>
    </div>
  );
};

export default ProfileCard;
