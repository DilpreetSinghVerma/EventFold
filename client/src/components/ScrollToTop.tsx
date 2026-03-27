import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // If there's a hash in the URL, don't scroll to top 
    // as we want to let the browser jump to the anchor
    if (window.location.hash) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [location]);

  return null;
}
