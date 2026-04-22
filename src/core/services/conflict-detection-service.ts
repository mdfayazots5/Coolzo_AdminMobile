/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SchedulingConflict } from "../network/scheduling-repository";
import { schedulingRepository } from "../network/scheduling-repository";

export class ConflictDetectionService {
  static async checkConflicts(
    serviceRequestId: string,
    technicianId: string,
    slotAvailabilityId: string,
  ): Promise<SchedulingConflict[]> {
    return schedulingRepository.getConflicts(serviceRequestId, technicianId, slotAvailabilityId);
  }
}
