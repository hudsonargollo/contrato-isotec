/**
 * Pipeline Stage Manager Component
 * Manages sales pipeline stages configuration
 * Requirements: 2.2 - Sales pipeline and stage management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, GripVertical, Save, X } from 'lucide-react';
import type { PipelineStage, CreatePipelineStageRequest } from '@/lib/types/crm';

interface PipelineStageManagerProps {
  tenantId: string;
  onStageChange?: (stages: PipelineStage[]) => void;
}

interface StageFormData {
  name: string;
  description: string;
  conversion_probability: number;
  required_actions: string[];
}

export function PipelineStageManager({ tenantId, onStageChange }: PipelineStageManagerProps) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<StageFormData>({
    name: '',
    description: '',
    conversion_probability: 0,
    required_actions: []
  });
  const [newAction, setNewAction] = useState('');

  useEffect(() => {
    fetchStages();
  }, [tenantId]);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/pipeline-stages', {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStages(data);
        onStageChange?.(data);
      }
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStage = async () => {
    try {
      const stageData: CreatePipelineStageRequest = {
        ...formData,
        stage_order: stages.length + 1
      };

      const response = await fetch('/api/crm/pipeline-stages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(stageData)
      });

      if (response.ok) {
        await fetchStages();
        setShowAddForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating pipeline stage:', error);
    }
  };

  const handleUpdateStage = async (stageId: string) => {
    try {
      const response = await fetch(`/api/crm/pipeline-stages/${stageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchStages();
        setEditingStage(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Are you sure you want to delete this stage?')) return;

    try {
      const response = await fetch(`/api/crm/pipeline-stages/${stageId}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        await fetchStages();
      }
    } catch (error) {
      console.error('Error deleting pipeline stage:', error);
    }
  };

  const startEditing = (stage: PipelineStage) => {
    setEditingStage(stage.id);
    setFormData({
      name: stage.name,
      description: stage.description || '',
      conversion_probability: stage.conversion_probability,
      required_actions: stage.required_actions
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      conversion_probability: 0,
      required_actions: []
    });
    setNewAction('');
  };

  const addRequiredAction = () => {
    if (newAction.trim()) {
      setFormData(prev => ({
        ...prev,
        required_actions: [...prev.required_actions, newAction.trim()]
      }));
      setNewAction('');
    }
  };

  const removeRequiredAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_actions: prev.required_actions.filter((_, i) => i !== index)
    }));
  };

  const renderStageForm = (isEditing: boolean, stage?: PipelineStage) => (
    <Card className="p-4 mb-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="stage-name">Stage Name</Label>
          <Input
            id="stage-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter stage name"
          />
        </div>

        <div>
          <Label htmlFor="stage-description">Description</Label>
          <Input
            id="stage-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter stage description"
          />
        </div>

        <div>
          <Label htmlFor="conversion-probability">Conversion Probability (%)</Label>
          <Input
            id="conversion-probability"
            type="number"
            min="0"
            max="100"
            value={formData.conversion_probability}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              conversion_probability: parseFloat(e.target.value) || 0 
            }))}
            placeholder="0-100"
          />
        </div>

        <div>
          <Label>Required Actions</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              placeholder="Add required action"
              onKeyPress={(e) => e.key === 'Enter' && addRequiredAction()}
            />
            <Button type="button" onClick={addRequiredAction} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.required_actions.map((action, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {action}
                <button
                  onClick={() => removeRequiredAction(index)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => isEditing ? handleUpdateStage(stage!.id) : handleCreateStage()}
            disabled={!formData.name.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update' : 'Create'} Stage
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (isEditing) {
                setEditingStage(null);
              } else {
                setShowAddForm(false);
              }
              resetForm();
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return <div className="p-4">Loading pipeline stages...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pipeline Stages</h3>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Stage
        </Button>
      </div>

      {showAddForm && renderStageForm(false)}

      <div className="space-y-2">
        {stages.map((stage) => (
          <Card key={stage.id} className="p-4">
            {editingStage === stage.id ? (
              renderStageForm(true, stage)
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stage.name}</span>
                      <Badge variant="outline">
                        {stage.conversion_probability}% conversion
                      </Badge>
                      {!stage.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {stage.description && (
                      <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                    )}
                    {stage.required_actions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {stage.required_actions.map((action, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(stage)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteStage(stage.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {stages.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No pipeline stages configured</p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Stage
          </Button>
        </Card>
      )}
    </div>
  );
}