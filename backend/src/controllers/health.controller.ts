import type { RequestHandler } from 'express';

import type { DataResponse } from '../types/api.js';

interface HealthStatus {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

export const getHealth: RequestHandler = (_req, res) => {
  const body: DataResponse<HealthStatus> = {
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  };
  res.json(body);
};
