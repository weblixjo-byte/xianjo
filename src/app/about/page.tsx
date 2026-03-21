'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Header from '@/components/Header';
import CartSidebar from '@/components/CartSidebar';
import { Award, Heart, Globe } from 'lucide-react';

export default function AboutPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  };

  return (
    <div className="bg-brand-cream min-h-screen font-body" dir="rtl">
      <Header onCartOpen={() => setIsSidebarOpen(true)} />

      <main className="pt-40">
        {/* HERO */}
        <section className="max-w-7xl mx-auto px-6 py-20 text-center space-y-12">
          <motion.div {...fadeIn}>
            <span className="text-brand-red font-bold tracking-widest uppercase text-xs">حكاية شيان</span>
            <h1 className="text-5xl md:text-8xl font-black text-brand-black luxury-heading mt-6">
               إرثٌ يُطبخ <span className="text-brand-red">بشغف.</span>
            </h1>
            <p className="text-brand-black/60 text-lg md:text-2xl max-w-4xl mx-auto leading-relaxed mt-10">
              من قلب الثقافة الآسيوية العريقة، انطلقت رحلة مطعم شيان لتقديم تجربةٍ طهويةٍ فريدة تجمع بين دفء التقاليد وفخامة التقديم.
            </p>
          </motion.div>
        </section>

        {/* PILLARS */}
        <section className="py-32 bg-white/50 border-y border-brand-gray/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { title: "الجودة", desc: "نلتزم باستخدام أجود المكونات الطازجة والتقليدية لنضمن نكهةً أصيلة في كل طبق.", icon: Award },
                { title: "الإتقان", desc: "نؤمن أن الطهي فنٌ يتطلب الدقة والشغف، وهذا ما يبرز في كل تفصيل نقدمه.", icon: Heart },
                { title: "التنوع", desc: "تضم قائمتنا تشكيلةً واسعة من المأكولات الآسيوية التي ترضي كافة الأذواق.", icon: Globe },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  {...fadeIn}
                  transition={{ delay: i * 0.2 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-brand-red/5 text-brand-red rounded-2xl flex items-center justify-center mx-auto">
                    <item.icon size={40} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-3xl font-black text-brand-black luxury-heading">{item.title}</h3>
                  <p className="text-brand-black/50 leading-loose">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* IMAGE & TEXT */}
        <section className="max-w-7xl mx-auto px-6 py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div {...fadeIn} className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
              <Image 
                src="/chef-heritage.png" 
                alt="Chef in action" 
                fill 
                className="object-cover"
              />
            </motion.div>
            <motion.div {...fadeIn} className="space-y-10">
              <h2 className="text-4xl md:text-6xl font-black text-brand-black leading-tight">في شيان، <br/> <span className="text-brand-red">الضيف هو محور اهتمامنا.</span></h2>
              <p className="text-brand-black/60 text-xl leading-relaxed">
                نحن نسعى دائماً لخلق بيئةٍ دافئةٍ ومرحبةٍ تتيح لضيوفنا الاستمتاع بوجباتهم في جوٍ من الهدوء والراحة، مع التركيز التام على جودة الخدمة والمذاق.
              </p>
              <div className="h-1 w-20 bg-brand-red rounded-full" />
            </motion.div>
          </div>
        </section>
      </main>

      <CartSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
