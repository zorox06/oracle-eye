import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Shield, Zap, Eye } from "lucide-react";
import { AlgorandWallet } from "@/components/wallet/AlgorandWallet";

export default function Home() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="content-container py-24 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="animate-fade-in">
              <Badge variant="outline" className="mb-6 glass">
                <Zap className="h-3 w-3 mr-2" />
                Powered by Algorand & Decentralized Oracle
              </Badge>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Prediction Markets
                </span>
                <br />
                <span className="bg-gradient-to-br from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  Powered by Truth
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
                Trade on real-world events with trustless oracle resolution.
                Non-custodial, transparent, and provably fair.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
                <Link to="/markets">
                  <Button size="lg" className="btn-primary group">
                    Explore Markets
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/oracle">
                  <Button size="lg" variant="outline" className="btn-secondary">
                    <Eye className="h-5 w-5 mr-2" />
                    View Oracle
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Wallet Widget */}
            <div className="animate-fade-in lg:animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <AlgorandWallet />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="content-container py-20">
        <div className="section-header text-center">
          <h2 className="section-title">Why OracleEye?</h2>
          <p className="section-subtitle">Built on Algorand for speed, security, and transparency</p>
        </div>

        <div className="card-grid stagger-container">
          {features.map((feature) => (
            <div key={feature.title} className="unified-card hover-lift">
              <div className={`rounded-lg p-3 w-fit mb-4 ${feature.colorClass}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40">
        <div className="content-container py-20">
          <div className="glass rounded-2xl p-12 text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect your wallet and start trading on real-world events in seconds.
            </p>
            <Link to="/markets">
              <Button size="lg" className="btn-primary">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    title: "Decentralized Oracle",
    description: "Multi-node consensus with 99.9% accuracy. Real-time price feeds from CoinGecko, Binance, and CryptoCompare.",
    icon: Eye,
    colorClass: "bg-primary/10 text-primary",
  },
  {
    title: "Non-Custodial",
    description: "Your funds stay in your wallet until you trade. Smart contracts hold stakes securely on Algorand.",
    icon: Shield,
    colorClass: "bg-green-500/10 text-green-500",
  },
  {
    title: "Instant Settlement",
    description: "Sub-4 second finality on Algorand. Claim winnings immediately after market resolution.",
    icon: Zap,
    colorClass: "bg-yellow-500/10 text-yellow-500",
  },
  {
    title: "Transparent Odds",
    description: "Live pool ratios show real-time odds. No hidden fees, no manipulation. Everything on-chain.",
    icon: TrendingUp,
    colorClass: "bg-purple-500/10 text-purple-500",
  },
];
