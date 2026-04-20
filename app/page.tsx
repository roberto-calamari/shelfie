'use client';

import { AnimatePresence } from 'framer-motion';
import { useWizardStore } from '@/lib/store';
import { IntroScreen } from '@/components/wizard/IntroScreen';
import { SearchStep } from '@/components/wizard/SearchStep';
import { WorkStep } from '@/components/wizard/WorkStep';
import { CoverStep } from '@/components/wizard/CoverStep';
import { CustomizeStep } from '@/components/wizard/CustomizeStep';
import { ExportStep } from '@/components/wizard/ExportStep';
import { StepProgress } from '@/components/ui/StepProgress';

const NUMBERED_STEPS = ['search', 'work', 'cover', 'customize', 'export'] as const;

export default function Home() {
  const step = useWizardStore((s) => s.step);

  const stepIndex = NUMBERED_STEPS.indexOf(step as (typeof NUMBERED_STEPS)[number]);
  const showProgress = stepIndex >= 0;

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {showProgress && (
        <StepProgress current={stepIndex + 1} total={NUMBERED_STEPS.length} />
      )}

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'intro' && <IntroScreen key="intro" />}
          {step === 'search' && <SearchStep key="search" />}
          {step === 'work' && <WorkStep key="work" />}
          {step === 'cover' && <CoverStep key="cover" />}
          {step === 'customize' && <CustomizeStep key="customize" />}
          {step === 'export' && <ExportStep key="export" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
