/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceRequest } from "../network/service-request-repository";
import { Technician } from "../network/technician-repository";

export interface ScheduleConflict {
  type: 'overlap' | 'travel' | 'shift' | 'skill' | 'zone';
  message: string;
  severity: 'error' | 'warning';
  relatedSRId?: string;
}

export class ConflictDetectionService {
  /**
   * Checks for conflicts when scheduling an SR to a technician at a specific time.
   */
  static async checkConflicts(
    sr: ServiceRequest,
    tech: Technician,
    startTime: Date,
    durationMinutes: number,
    existingTechSRs: ServiceRequest[]
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    // 1. Shift Check
    const dayOfWeek = startTime.getDay();
    const shift = tech.shifts.find(s => s.dayOfWeek === dayOfWeek);
    if (!shift || shift.isOffDay) {
      conflicts.push({
        type: 'shift',
        message: `${tech.name} is off-duty on this day.`,
        severity: 'error'
      });
    } else {
      const [shiftStartH, shiftStartM] = shift.startTime.split(':').map(Number);
      const [shiftEndH, shiftEndM] = shift.endTime.split(':').map(Number);
      
      const shiftStart = new Date(startTime);
      shiftStart.setHours(shiftStartH, shiftStartM, 0, 0);
      
      const shiftEnd = new Date(startTime);
      shiftEnd.setHours(shiftEndH, shiftEndM, 0, 0);

      if (startTime < shiftStart || endTime > shiftEnd) {
        conflicts.push({
          type: 'shift',
          message: `Job falls outside ${tech.name}'s shift hours (${shift.startTime} - ${shift.endTime}).`,
          severity: 'warning'
        });
      }
    }

    // 2. Overlap Check
    for (const existing of existingTechSRs) {
      if (!existing.scheduling.startTime || !existing.scheduling.endTime) continue;
      if (existing.id === sr.id) continue;

      const exStart = new Date(existing.scheduling.startTime);
      const exEnd = new Date(existing.scheduling.endTime);

      // Check for overlap
      if (startTime < exEnd && endTime > exStart) {
        conflicts.push({
          type: 'overlap',
          message: `Overlaps with ${existing.srNumber} (${new Date(exStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(exEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          severity: 'error',
          relatedSRId: existing.id
        });
      }
    }

    // 3. Zone Match
    if (!tech.zones.includes(sr.location.zoneId)) {
      conflicts.push({
        type: 'zone',
        message: `${tech.name} is not assigned to Zone ${sr.location.zoneId}.`,
        severity: 'warning'
      });
    }

    // 4. Skill Match
    const brandMatch = tech.skills.some(s => s.name.toLowerCase().includes(sr.equipment.brand.toLowerCase()));
    if (!brandMatch) {
      conflicts.push({
        type: 'skill',
        message: `${tech.name} is not certified for ${sr.equipment.brand}.`,
        severity: 'warning'
      });
    }

    return conflicts;
  }
}
