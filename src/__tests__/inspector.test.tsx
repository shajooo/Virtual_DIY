import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PartInspector } from '../components/inspector/PartInspector';
import { useProjectStore } from '../store/projectStore';
import { Part } from '../types/part';

describe('Part Inspector Component (Phase 8b & 9a)', () => {
  beforeEach(() => {
    useProjectStore.getState().newProject('Inspector Test');
  });

  const testBoxPart: Part = {
    id: 'test-inspector-box',
    name: 'Inspector Box',
    params: {
      type: 'box',
      width: 75,
      depth: 50,
      height: 25,
      cornerRadius: 0,
    },
    transform: {
      position: { x: 0, y: 12.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    material: 'cardboard',
    color: '#c29b68',
    visible: true,
  };

  it('rendering PartInspector with a box part shows width/depth/height fields', () => {
    useProjectStore.getState().addPart(testBoxPart);

    render(<PartInspector part={testBoxPart} />);

    expect(screen.getByText(/Width \(mm\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Depth \(mm\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Height \(mm\)/i)).toBeInTheDocument();

    const widthInput = screen.getByDisplayValue('75') as HTMLInputElement;
    const depthInput = screen.getByDisplayValue('50') as HTMLInputElement;
    const heightInput = screen.getByDisplayValue('25') as HTMLInputElement;

    expect(widthInput).toBeInTheDocument();
    expect(depthInput).toBeInTheDocument();
    expect(heightInput).toBeInTheDocument();
  });

  it('changing width field calls updatePartParams with new width', () => {
    useProjectStore.getState().addPart(testBoxPart);

    render(<PartInspector part={testBoxPart} />);

    const widthInput = screen.getByDisplayValue('75') as HTMLInputElement;
    fireEvent.change(widthInput, { target: { value: '110' } });

    const updatedPart = useProjectStore
      .getState()
      .present.parts.find((p) => p.id === testBoxPart.id);
    expect(updatedPart?.params.type).toBe('box');
    if (updatedPart?.params.type === 'box') {
      expect(updatedPart.params.width).toBe(110);
    }
  });

  it('setting dimension to 0 or negative shows inline validation error and does NOT update store', () => {
    useProjectStore.getState().addPart(testBoxPart);

    render(<PartInspector part={testBoxPart} />);

    const widthInput = screen.getByDisplayValue('75') as HTMLInputElement;
    fireEvent.change(widthInput, { target: { value: '0' } });

    // Inline validation error displayed
    expect(screen.getByText(/width must be greater than 0/i)).toBeInTheDocument();

    // Store is NOT updated to 0
    const partInStore = useProjectStore
      .getState()
      .present.parts.find((p) => p.id === testBoxPart.id);
    if (partInStore?.params.type === 'box') {
      expect(partInStore.params.width).toBe(75);
    }
  });
});
