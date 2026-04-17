import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for individuals and small teams',
    price: '$29',
    period: '/month',
    cta: 'Start Free Trial',
    popular: false,
    features: [
      { name: 'Up to 5 websites', included: true },
      { name: 'Quick Scan only', included: true },
      { name: 'Basic vulnerability detection', included: true },
      { name: 'Email support', included: true },
      { name: 'API access', included: false },
      { name: 'Deep Scan', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  {
    name: 'Professional',
    description: 'For growing security teams',
    price: '$99',
    period: '/month',
    cta: 'Start Free Trial',
    popular: true,
    features: [
      { name: 'Unlimited websites', included: true },
      { name: 'Quick & Deep Scan', included: true },
      { name: 'Advanced AI analysis', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Full API access', included: true },
      { name: 'Browser extension support', included: true },
      { name: 'Slack integration', included: true },
      { name: 'Priority support', included: false },
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    price: 'Custom',
    period: 'pricing',
    cta: 'Contact Sales',
    popular: false,
    features: [
      { name: 'Unlimited everything', included: true },
      { name: 'Quick & Deep Scan', included: true },
      { name: 'Advanced AI analysis', included: true },
      { name: '24/7 phone support', included: true },
      { name: 'Full API access', included: true },
      { name: 'On-premise deployment', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated account manager', included: true },
    ],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">GG</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">GeniusGuard</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/signin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</a>
            <a href="/signup" className="inline-block">
              <Button size="sm">Start Free</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your security scanning needs. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => (
            <Card
              key={idx}
              className={`relative p-8 bg-card/50 backdrop-blur-sm border-border transition-all duration-300 hover:border-primary/50 ${
                plan.popular ? 'ring-2 ring-primary md:scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                  {plan.cta}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>

              {/* Features */}
              <div className="border-t border-border pt-6">
                <p className="text-sm font-semibold text-foreground mb-4">What's included:</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check size={18} className="text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <X size={18} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I change plans anytime?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal, and wire transfers for enterprise customers.',
              },
              {
                q: 'Do you offer discounts for annual billing?',
                a: 'Yes! Annual plans come with 20% discount. Contact our sales team for enterprise volume discounts.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Absolutely! All plans include a 14-day free trial with full access to features. No credit card required.',
              },
              {
                q: 'What happens if I exceed my plan limits?',
                a: 'We will notify you before you exceed limits. You can upgrade anytime, or we can discuss custom limits for your needs.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee if you are not satisfied with GeniusGuard.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-border bg-card/30 hover:border-primary/50 transition-colors">
                <h3 className="font-semibold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="inline-block p-12 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">Ready to get started?</h3>
            <p className="text-muted-foreground mb-6">Join thousands of security teams already using GeniusGuard.</p>
            <Button size="lg" className="gap-2">
              Start Your Free Trial
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
