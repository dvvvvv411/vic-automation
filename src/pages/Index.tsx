import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(160_80%_55%/0.06),transparent_70%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center relative z-10"
      >
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-bold tracking-tighter text-foreground">
          Vic Automation
          <span className="text-primary"> 2.0</span>
        </h1>
      </motion.div>
    </div>
  );
};

export default Index;
