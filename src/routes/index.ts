import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import branchRoutes from './branch.routes';
import clinicRoutes from './clinic.routes';
import diagnosisRoutes from './diagnosis.routes';
import treatmentRoutes from './treatment.routes';
import doctorRoutes from './doctor.routes';
import assistantRoutes from './assistant.routes';
import ProductRoutes from './product.routes';
import PaymentRoutes from './payment.routes';
import roomRoutes from './room.routes';
import patientRoutes from './patient.routes';
import patientOptionsRoutes from './patient-options.routes';
import appointmentRoutes from './appointment.routes';
import opdRoutes from './opd.routes';
import drugRoutes from './drug.routes';
import drugOptionsRoutes from './drug-opitons.routes';
import { notFoundHandler } from '../middlewares/error.middleware';

const router = Router();

// API Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// ลงทะเบียนเส้นทางทั้งหมด
router.use('/auth', authRoutes);
router.use('/clinics', clinicRoutes);
router.use('/users', userRoutes);
router.use('/branches', branchRoutes);
router.use('/diagnoses', diagnosisRoutes);
router.use('/treatments', treatmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/assistants', assistantRoutes);
router.use('/products', ProductRoutes);
router.use('/payments', PaymentRoutes);
router.use('/rooms', roomRoutes);
router.use('/patients', patientRoutes);
router.use('/patient-options', patientOptionsRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/opds', opdRoutes);
router.use('/drugs', drugRoutes);
router.use('/drug-options', drugOptionsRoutes);

// จัดการเส้นทางที่ไม่มีอยู่
router.all('/{*any}', notFoundHandler);

export default router;