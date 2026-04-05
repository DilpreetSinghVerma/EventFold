import { Link } from 'react-router-dom';
import {
  Camera,
  Upload,
  Share2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Star,
  MessageCircle,
  Image,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.12 },
  },
};

const features = [
  {
    icon: Upload,
    title: 'Upload & Organize',
    description:
      'Drag and drop your shoot photos. Organize them into beautiful galleries ready for client review.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Share2,
    title: 'Share Instantly',
    description:
      'Generate a unique link for your client. No account needed — they just click and browse.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: CheckCircle2,
    title: 'Smart Selection',
    description:
      'Clients pick their favorites with one tap. Star ratings and comments for detailed feedback.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description:
      'See selections in real-time on your dashboard. Export the final picks and deliver faster.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
];

const stats = [
  { value: '10x', label: 'Faster Delivery' },
  { value: '100%', label: 'Client Satisfaction' },
  { value: '0', label: 'Email Threads' },
  { value: '∞', label: 'Photos Supported' },
];

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-700/5 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-emerald-500/3 blur-[100px]" />
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="mb-8 inline-flex">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                Photo Selection Tool for Professionals
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-6"
          >
            Let Clients Pick{' '}
            <span className="gradient-text text-glow-strong">
              Their Favorites
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload your shoot, share a link, and let your clients select their
            favorite photos. No back-and-forth emails. Just beautiful,
            effortless collaboration.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/create"
              className="group px-8 py-4 rounded-2xl gradient-primary text-white font-semibold text-lg glow-primary-lg hover:opacity-90 transition-all duration-300 flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Create Gallery
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-4 rounded-2xl glass glass-hover text-foreground font-semibold text-lg transition-all duration-300 flex items-center gap-2"
            >
              <Image className="w-5 h-5 text-primary" />
              View Dashboard
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6">
        <motion.div
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="text-center p-6 rounded-2xl glass"
            >
              <div className="text-3xl md:text-4xl font-display font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Four simple steps to streamline your photo delivery workflow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="group p-6 rounded-2xl glass glass-hover transition-all duration-300 hover:-translate-y-1 relative"
              >
                {/* Step number */}
                <div className="absolute top-4 right-4 text-xs font-mono text-muted-foreground/50">
                  0{i + 1}
                </div>

                <div
                  className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Client Experience Preview */}
      <section className="py-20 px-6">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
              Your Clients Will{' '}
              <span className="gradient-text">Love It</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A beautiful, intuitive experience that makes photo selection a joy.
            </p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: CheckCircle2,
                title: 'One-Tap Selection',
                desc: 'Select or reject photos instantly with a single tap',
                color: 'text-emerald-400',
              },
              {
                icon: Star,
                title: 'Star Ratings',
                desc: 'Rate favorites to help photographers understand preferences',
                color: 'text-yellow-400',
              },
              {
                icon: MessageCircle,
                title: 'Photo Comments',
                desc: 'Leave notes on specific photos for editing instructions',
                color: 'text-blue-400',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl glass glass-hover text-center transition-all duration-300 hover:-translate-y-1"
              >
                <item.icon className={`w-10 h-10 ${item.color} mx-auto mb-4`} />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div
            variants={fadeInUp}
            className="p-12 rounded-3xl glass relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-700/5" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Ready to Streamline Your Workflow?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                Start creating galleries and deliver photos faster than ever.
              </p>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-primary text-white font-semibold text-lg glow-primary-lg hover:opacity-90 transition-all duration-300"
              >
                <Camera className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
