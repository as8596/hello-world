import Hero from "@/components/Hero";
import FeaturedSeries from "@/components/FeaturedSeries";
import HowItWorks from "@/components/HowItWorks";
import BrandValues from "@/components/BrandValues";
import MerchGrid from "@/components/MerchGrid";
import NewDropBanner from "@/components/NewDropBanner";
import Newsletter from "@/components/Newsletter";

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedSeries />
      <HowItWorks />
      <BrandValues />
      <MerchGrid />
      <NewDropBanner />
      <Newsletter />
    </>
  );
}
