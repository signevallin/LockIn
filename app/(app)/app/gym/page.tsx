'use client';
import { useState } from 'react';
import { useWorkoutTemplates } from '@/lib/hooks/useWorkoutTemplates';
import { useWorkoutSessions } from '@/lib/hooks/useWorkoutSessions';
import { WorkoutTemplateList } from '@/components/gym/WorkoutTemplateList';
import { WorkoutTemplateForm } from '@/components/gym/WorkoutTemplateForm';
import { ActiveWorkout } from '@/components/gym/ActiveWorkout';
import type { WorkoutTemplate, SessionExercise } from '@/lib/types';

export default function GymPage() {
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } = useWorkoutTemplates();
  const { getLastSet, saveSession } = useWorkoutSessions();
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | undefined>();

  async function handleFormSubmit(name: string, exerciseIds: string[]) {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, name, exerciseIds);
    } else {
      await addTemplate(name, exerciseIds);
    }
  }

  function openEdit(template: WorkoutTemplate) {
    setEditingTemplate(template);
    setFormOpen(true);
  }

  function openNew() {
    setEditingTemplate(undefined);
    setFormOpen(true);
  }

  async function handleFinish(exercises: SessionExercise[]) {
    if (!activeTemplate) return;
    await saveSession(activeTemplate.id, activeTemplate.name, exercises);
    setActiveTemplate(null);
  }

  return (
    <div className="p-4 space-y-4">
      {activeTemplate ? (
        <ActiveWorkout
          template={activeTemplate}
          getLastSet={getLastSet}
          onFinish={handleFinish}
          onBack={() => setActiveTemplate(null)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between pt-2">
            <h1 className="text-xl font-bold text-earth">Gym</h1>
            <button
              onClick={openNew}
              className="text-sm bg-sky text-earth px-3 py-1.5 rounded-full font-medium"
            >
              + Ny mall
            </button>
          </div>
          <WorkoutTemplateList
            templates={templates}
            loading={loading}
            onStart={setActiveTemplate}
            onEdit={openEdit}
            onDelete={deleteTemplate}
            onNew={openNew}
          />
        </>
      )}

      <WorkoutTemplateForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingTemplate(undefined); }}
        onSubmit={handleFormSubmit}
        existing={editingTemplate}
      />
    </div>
  );
}
