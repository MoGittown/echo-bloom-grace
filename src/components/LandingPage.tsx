import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BrandingData } from '@/hooks/useBranding';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChefHat, Clock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface LandingPageProps {
  branding: BrandingData;
  onStart: () => void;
}

export function LandingPage({ branding, onStart }: LandingPageProps) {
  const { landingPage, studioName, logoUrl } = branding;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-lg flex items-center justify-center">
                <img src={logoUrl} alt="Studio Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <ChefHat className="w-7 h-7 text-primary" />
              </div>
            )}
            {studioName && (
              <span className="font-semibold text-lg hidden sm:inline">{studioName}</span>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-4 sm:px-6 pb-12">
        <div className="max-w-4xl mx-auto pt-8 sm:pt-16">
          {/* Time Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Clock className="w-4 h-4" />
              In nur 7 Minuten perfekt vorbereitet
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-center leading-tight mb-6"
          >
            {landingPage.headline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-10"
          >
            {landingPage.subheadline}
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center mb-16"
          >
            <Button 
              size="lg" 
              onClick={onStart}
              className="text-lg px-8 py-6 h-auto gap-2 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              {landingPage.ctaText}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid sm:grid-cols-3 gap-6 mb-16"
          >
            {[landingPage.benefit1, landingPage.benefit2, landingPage.benefit3].map((benefit, index) => (
              <div 
                key={index}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium">{benefit}</p>
              </div>
            ))}
          </motion.div>

          {/* Why Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <h3 className="font-display font-semibold text-lg mb-3 text-center">
                Warum diese Checkliste?
              </h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                {landingPage.whyText}
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-4 border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          {studioName ? (
            <span>© {new Date().getFullYear()} {studioName}</span>
          ) : (
            <span>Küchen-Beratungsprotokoll</span>
          )}
        </div>
      </footer>
    </div>
  );
}
