import { AlertTriangle, GitBranch, LayoutGrid, Plus, Boxes } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { NewPresetModal } from '@/components/registry/NewPresetModal';
import { PresetCard } from '@/components/registry/PresetCard';
import { StatCard } from '@/components/registry/StatCard';
import { useBranchStore } from '@/store/useBranchStore';
import { useToastStore } from '@/store/useToastStore';
import { fadeInUp, stagger } from '@/lib/motion';

export const RegistryPage = () => {
  const { presets, ruleViolations, generationCount } = useBranchStore();
  const addPreset = useBranchStore((s) => s.addPreset);
  const removePreset = useBranchStore((s) => s.removePreset);
  const pushToast = useToastStore((s) => s.push);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <motion.div
      variants={stagger(0.04, 0.07)}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      <motion.header variants={fadeInUp} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase-wide text-text-secondary">Registry Hub</p>
          <h1 className="mt-1 text-xl font-mono text-text-primary">
            Manage operational naming conventions and structural protocols.
          </h1>
        </div>
        <Button
          variant="primary"
          leadingIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setModalOpen(true)}
        >
          New Preset HUD
        </Button>
      </motion.header>

      <motion.section
        variants={stagger(0.1, 0.08)}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <motion.div variants={fadeInUp}>
          <StatCard
            label="Active Presets"
            value={presets.length}
            footer="SYS_SYNC_OK"
            accent="cyan"
            icon={<LayoutGrid className="h-4 w-4" />}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            label="Branches Gen"
            value={generationCount}
            footer="VOL_NORMAL"
            accent="magenta"
            icon={<GitBranch className="h-4 w-4" />}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            label="Rule Violations"
            value={ruleViolations}
            footer="ALL_CLEAR"
            accent="violet"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </motion.div>
      </motion.section>

      <motion.section variants={fadeInUp} className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Boxes className="h-4 w-4 text-cyber-cyan" />
          <h2 className="font-semibold">Project Modules</h2>
        </div>

        {presets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="panel-frame flex flex-col items-center gap-3 p-10 text-center"
          >
            <p className="text-sm text-text-secondary">No presets registered yet.</p>
            <Button
              variant="primary"
              leadingIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setModalOpen(true)}
            >
              Register the first preset
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger(0.05, 0.08)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {presets.map((preset) => (
              <motion.div key={preset.id} variants={fadeInUp} layout>
                <PresetCard
                  preset={preset}
                  onDelete={(id) => {
                    removePreset(id);
                    pushToast({ message: 'Preset terminated', variant: 'info' });
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>

      <NewPresetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(preset) => {
          addPreset(preset);
          pushToast({ message: `Preset "${preset.name}" registered`, variant: 'success' });
        }}
      />
    </motion.div>
  );
};
