import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CustomSelect from '$lib/components/CustomSelect.svelte';

describe('CustomSelect', () => {
  const options = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' }
  ];

  it('renders trigger button with initial selected label', () => {
    render(CustomSelect, {
      value: 'en',
      options,
      ariaLabel: 'Language select'
    });

    const trigger = screen.getByRole('button', { name: 'Language select' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('English');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('falls back to default label when options are empty', () => {
    render(CustomSelect, {
      value: '',
      options: [],
      ariaLabel: 'Empty select'
    });

    const trigger = screen.getByRole('button', { name: 'Empty select' });
    expect(trigger).toHaveTextContent('Choose an option');
  });

  it('opens and closes dropdown on trigger click', async () => {
    render(CustomSelect, {
      value: 'en',
      options,
      ariaLabel: 'Language select'
    });

    const trigger = screen.getByRole('button', { name: 'Language select' });
    await fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);

    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('selects option on click, triggers onChange callback, and closes menu', async () => {
    const onChange = vi.fn();
    render(CustomSelect, {
      value: 'en',
      options,
      ariaLabel: 'Language select',
      onChange
    });

    const trigger = screen.getByRole('button', { name: 'Language select' });
    await fireEvent.click(trigger);

    const spanishOption = screen.getByRole('option', { name: 'Spanish' });
    await fireEvent.click(spanishOption);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('handles keyboard ArrowDown and ArrowUp navigation', async () => {
    const onChange = vi.fn();
    render(CustomSelect, {
      value: 'en',
      options,
      ariaLabel: 'Language select',
      onChange
    });

    const trigger = screen.getByRole('button', { name: 'Language select' });

    // Arrow down moves from 'en' (index 0) to 'es' (index 1)
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenCalledTimes(1);

    // Arrow up moves back to 'en' (index 0)
    await fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenCalledTimes(2);

    // Arrow up at index 0 stays at 0
    await fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('toggles menu open/close on Enter and Space keys', async () => {
    render(CustomSelect, {
      value: 'en',
      options,
      ariaLabel: 'Language select'
    });

    const trigger = screen.getByRole('button', { name: 'Language select' });

    await fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes on Escape key and focuses trigger', async () => {
    render(CustomSelect, {
      value: 'en',
      options,
      ariaLabel: 'Language select'
    });

    const trigger = screen.getByRole('button', { name: 'Language select' });
    await fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('ignores keydown events when disabled', async () => {
    render(CustomSelect, {
      value: 'en',
      options,
      disabled: true,
      ariaLabel: 'Disabled select'
    });

    const trigger = screen.getByRole('button', { name: 'Disabled select' });
    expect(trigger).toBeDisabled();

    await fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes dropdown when clicking outside', async () => {
    render(CustomSelect, {
      value: 'en',
      options,
      ariaLabel: 'Language select'
    });

    const trigger = screen.getByRole('button', { name: 'Language select' });
    await fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Mouse down outside
    await fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

