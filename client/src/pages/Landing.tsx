import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Shield, Zap, Brain, BarChart3, Lock, Workflow } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">GG</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">GeniusGuard</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
            <a href="/signin" className="inline-block">
              <Button size="sm" variant="outline">Sign In</Button>
            </a>
            <a href="/signup" className="inline-block">
              <Button size="sm">Sign Up</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm font-medium text-primary">🚀 AI-Powered Security Scanning</span>
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Enterprise Security,
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"> Intelligently Automated</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                GeniusGuard combines advanced AI analysis with multi-modal scanning to detect vulnerabilities faster, reduce false positives, and provide actionable remediation guidance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/dashboard" className="inline-block">
                  <Button size="lg" className="gap-2">
                    View Dashboard <ArrowRight size={20} />
                  </Button>
                </a>
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-8 text-sm text-muted-foreground">
                <div>✓ No credit card required</div>
                <div>✓ 14-day free trial</div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent rounded-2xl blur-3xl"></div>
              <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="h-3 bg-muted rounded-full w-3/4"></div>
                  <div className="h-3 bg-muted rounded-full w-1/2"></div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-3 h-3 rounded-full bg-destructive"></div>
                      <div className="h-2 bg-muted rounded w-32"></div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <div className="h-2 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Powerful Features for Enterprise Security
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to identify, analyze, and remediate vulnerabilities at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <Zap size={24} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">Quick Scan</h3>
              <p className="text-muted-foreground">
                Instant vulnerability detection for rapid feedback in your CI/CD pipeline. Catch issues before they reach production.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <Shield size={24} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">Deep Scan</h3>
              <p className="text-muted-foreground">
                Interactive session recording with AI analysis to uncover complex vulnerabilities and business logic flaws.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <Brain size={24} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">AI Analysis</h3>
              <p className="text-muted-foreground">
                Intelligent prioritization and context-specific remediation guidance powered by advanced machine learning.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <BarChart3 size={24} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">Threat Intelligence</h3>
              <p className="text-muted-foreground">
                Real-time dashboard with comprehensive insights into your security posture and emerging threats.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <Lock size={24} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">Enterprise Security</h3>
              <p className="text-muted-foreground">
                RBAC, multi-tenancy, and compliance reporting for GDPR, HIPAA, and PCI-DSS standards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <Workflow size={24} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">DevOps Integration</h3>
              <p className="text-muted-foreground">
                Seamless integration with Jira, GitHub, Jenkins, and your existing security tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Scan Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Try Quick Scan Now
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get instant vulnerability insights for any website. No sign-up required for this quick test.
            </p>
          </div>

          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border">
            <div className="flex gap-3 mb-4">
              <input
                type="url"
                placeholder="https://example.com"
                className="flex-1 px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="gap-2 px-6">
                <Zap size={18} />
                Scan
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              💡 Tip: Sign in to unlock Deep Scan and advanced features for comprehensive security analysis
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-2xl"></div>
            <div className="relative bg-card/50 backdrop-blur-sm border border-border p-12 md:p-16 text-center">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                Ready to Transform Your Security?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join enterprise teams that trust GeniusGuard to protect their digital assets with AI-powered intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gap-2">
                  Get Started Now <ArrowRight size={20} />
                </Button>
                <Button size="lg" variant="outline">
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">GG</span>
                </div>
                <span className="font-display font-bold text-foreground">GeniusGuard</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered security scanning for enterprises.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2026 GeniusGuard. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
