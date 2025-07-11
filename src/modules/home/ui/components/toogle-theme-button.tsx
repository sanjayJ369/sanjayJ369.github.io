"use client";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/useSound";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ToggleThemeButton = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [currTheme, setCurrTheme] = useState<string>("system");
  const { play: playSwitchSound } = useSound("sounds/laser.mp3");

  useEffect(() => {
    if (!resolvedTheme) {
      setTheme("light");
      setCurrTheme("light");
    } else {
      setCurrTheme(resolvedTheme);
    }
  }, [setCurrTheme, setTheme, resolvedTheme]);

  const handleToggle = () => {
    playSwitchSound();
    const newTheme = currTheme == "dark" ? "light" : "dark";
    setCurrTheme(newTheme);
    setTheme(newTheme);
  };

  return (
    <Button
      className="m-1"
      onClick={handleToggle}
      size={"icon"}
      playClick={false}
    >
      {currTheme == "dark" ? <MoonIcon /> : <SunIcon />}
    </Button>
  );
};

export default ToggleThemeButton;
