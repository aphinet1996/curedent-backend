import mongoose, { Schema } from 'mongoose';
import {
    IAppointmentDocument,
    AppointmentStatus,
    AppointmentType,
    IAppointmentTag,
    IGoogleCalendarInfo,
    calculateDuration,
    combineDateTime,
    isToday
} from '../types/appointment.types';

/**
 * Schema สำหรับ Google Calendar Info
 */
const googleCalendarSchema = new Schema<IGoogleCalendarInfo>({
    eventId: {
        type: String,
        trim: true
    },
    calendarId: {
        type: String,
        trim: true
    },
    syncStatus: {
        type: String,
        enum: ['pending', 'synced', 'failed'],
        default: 'pending'
    },
    lastSyncAt: {
        type: Date
    },
    syncError: {
        type: String,
        trim: true,
        maxlength: [500, 'ข้อความแสดงข้อผิดพลาดต้องไม่เกิน 500 ตัวอักษร']
    }
}, { _id: false });

/**
 * Schema สำหรับ Appointment Tag
 */
const appointmentTagSchema = new Schema<IAppointmentTag>({
    name: {
        type: String,
        required: [true, 'ชื่อแท็กเป็นข้อมูลที่จำเป็น'],
        trim: true,
        maxlength: [50, 'ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร']
    },
    color: {
        type: String,
        trim: true,
        maxlength: [20, 'สีแท็กต้องไม่เกิน 20 ตัวอักษร']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'คำอธิบายแท็กต้องไม่เกิน 200 ตัวอักษร']
    }
}, { _id: false });

/**
 * Schema สำหรับข้อมูลผู้ป่วยที่ไม่มีในระบบ
 */
const guestPatientSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'ชื่อผู้ป่วยต้องไม่เกิน 200 ตัวอักษร']
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: [20, 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (v: string) {
                if (!v) return true; // Optional field
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'รูปแบบอีเมลไม่ถูกต้อง'
        }
    }
}, { _id: false });

/**
 * Schema สำหรับข้อมูลผู้ป่วยในระบบ
 */
const registeredPatientSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        validate: {
            validator: async function (v: string) {
                if (!v) return false;
                const patient = await mongoose.model('Patient').findById(v);
                return patient !== null;
            },
            message: 'ผู้ป่วยที่ระบุไม่พบในระบบ'
        }
    }
}, { _id: false });

/**
 * Schema หลักสำหรับ Appointment
 */
const appointmentSchema = new Schema<IAppointmentDocument>(
    {
        title: {
            type: String,
            required: [true, 'ชื่อไตเติลเป็นข้อมูลที่จำเป็น'],
            maxlength: [200, 'ชื่อแท็กต้องไม่เกิน 200 ตัวอักษร']
        },

        // ข้อมูลผู้ป่วย (Discriminated Union)
        patient: {
            isRegistered: {
                type: Boolean,
                required: [true, 'ต้องระบุว่าเป็นผู้ป่วยในระบบหรือไม่']
            },
            // สำหรับผู้ป่วยในระบบ
            patientId: {
                type: Schema.Types.ObjectId,
                ref: 'Patient',
                required: function (this: any) {
                    return this.patient?.isRegistered === true;
                },
                validate: {
                    validator: async function (v: string) {
                        if (!v) return true; // จะถูก validate ด้วย required ข้างบน
                        const patient = await mongoose.model('Patient').findById(v);
                        return patient !== null;
                    },
                    message: 'ผู้ป่วยที่ระบุไม่พบในระบบ'
                }
            },
            // สำหรับผู้ป่วยไม่มีในระบบ
            name: {
                type: String,
                trim: true,
                maxlength: [200, 'ชื่อผู้ป่วยต้องไม่เกิน 200 ตัวอักษร'],
                required: function (this: any) {
                    return this.patient?.isRegistered === false;
                }
            },
            phone: {
                type: String,
                trim: true,
                maxlength: [20, 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร'],
                required: function (this: any) {
                    return this.patient?.isRegistered === false;
                }
            },
            email: {
                type: String,
                trim: true,
                lowercase: true,
                validate: {
                    validator: function (v: string) {
                        if (!v) return true; // Optional field
                        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                    },
                    message: 'รูปแบบอีเมลไม่ถูกต้อง'
                }
            }
        },

        // ข้อมูลการนัดหมาย
        appointmentDate: {
            type: Date,
            required: [true, 'วันที่นัดหมายเป็นข้อมูลที่จำเป็น'],
            validate: {
                validator: function (v: Date) {
                    // อนุญาตให้นัดในอดีตได้ (เผื่อกรณีบันทึกย้อนหลัง)
                    return v instanceof Date;
                },
                message: 'รูปแบบวันที่นัดหมายไม่ถูกต้อง'
            }
        },
        startTime: {
            type: String,
            required: [true, 'เวลาเริ่มต้นเป็นข้อมูลที่จำเป็น'],
            trim: true,
            validate: {
                validator: function (time: string) {
                    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
                },
                message: 'รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:mm)'
            }
        },
        endTime: {
            type: String,
            required: [true, 'เวลาสิ้นสุดเป็นข้อมูลที่จำเป็น'],
            trim: true,
            validate: {
                validator: function (time: string) {
                    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
                },
                message: 'รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:mm)'
            }
        },
        duration: {
            type: Number,
            min: [15, 'ระยะเวลาการนัดหมายต้องอย่างน้อย 15 นาที'],
            default: function (this: any) {
                if (this.startTime && this.endTime) {
                    return calculateDuration(this.startTime, this.endTime);
                }
                return 30; // default 30 minutes
            }
        },

        // ประเภทและสถานะ
        type: {
            type: String,
            enum: {
                values: Object.values(AppointmentType),
                message: 'ประเภทการนัดหมายไม่ถูกต้อง'
            },
            // required: [true, 'ประเภทการนัดหมายเป็นข้อมูลที่จำเป็น']
        },
        status: {
            type: String,
            enum: {
                values: Object.values(AppointmentStatus),
                message: 'สถานะการนัดหมายไม่ถูกต้อง'
            },
            default: AppointmentStatus.SCHEDULED
        },

        // ข้อมูลเพิ่มเติม
        tags: [appointmentTagSchema],
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, 'หมายเหตุต้องไม่เกิน 1000 ตัวอักษร']
        },

        // Google Calendar Integration
        googleCalendar: googleCalendarSchema,

        // ข้อมูลระบบ
        clinicId: {
            type: Schema.Types.ObjectId,
            ref: 'Clinic',
            required: [true, 'คลินิกเป็นข้อมูลที่จำเป็น'],
            validate: {
                validator: async function (v: string) {
                    const clinic = await mongoose.model('Clinic').findById(v);
                    return clinic !== null;
                },
                message: 'คลินิกที่ระบุไม่พบในระบบ'
            }
        },
        branchId: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            required: [true, 'สาขาเป็นข้อมูลที่จำเป็น'],
            validate: {
                validator: async function (v: string) {
                    const branch = await mongoose.model('Branch').findById(v);
                    return branch !== null;
                },
                message: 'สาขาที่ระบุไม่พบในระบบ'
            }
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
            required: [true, 'แพทย์เป็นข้อมูลที่จำเป็น'],
            validate: {
                validator: async function (v: string) {
                    const doctor = await mongoose.model('Doctor').findById(v);
                    return doctor !== null;
                },
                message: 'แพทย์ที่ระบุไม่พบในระบบ'
            }
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/**
 * Indexes
 */
appointmentSchema.index({ clinicId: 1, branchId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ 'patient.patientId': 1 }, { sparse: true });
appointmentSchema.index({ appointmentDate: 1, status: 1 });
appointmentSchema.index({ status: 1, isActive: 1 });
appointmentSchema.index({ appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ createdAt: -1 });

// Compound index สำหรับป้องกัน time conflict
appointmentSchema.index(
    { doctorId: 1, appointmentDate: 1, startTime: 1, endTime: 1 },
    {
        partialFilterExpression: {
            isActive: true,
            status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] }
        }
    }
);

/**
 * Virtual Properties
 */
appointmentSchema.virtual('appointmentDateTime').get(function (this: IAppointmentDocument) {
    return combineDateTime(this.appointmentDate, this.startTime);
});

appointmentSchema.virtual('isToday').get(function (this: IAppointmentDocument) {
    return isToday(this.appointmentDate);
});

appointmentSchema.virtual('isPast').get(function (this: IAppointmentDocument) {
    const appointmentDateTime = combineDateTime(this.appointmentDate, this.startTime);
    return appointmentDateTime < new Date();
});

appointmentSchema.virtual('isFuture').get(function (this: IAppointmentDocument) {
    const appointmentDateTime = combineDateTime(this.appointmentDate, this.startTime);
    return appointmentDateTime > new Date();
});

/**
 * Instance Methods
 */
appointmentSchema.methods.getPatientName = function (this: IAppointmentDocument): string {
    if (this.patient.isRegistered && this.populated('patient.patientId')) {
        const patient = this.patient.patientId as any;
        return patient.fullNameTh || `${patient.titlePrefix || ''}${patient.firstNameTh} ${patient.lastNameTh}`;
    }
    if (!this.patient.isRegistered) {
        return this.patient.name || 'ไม่ระบุชื่อผู้ป่วย';
    }
    return 'ไม่ระบุชื่อผู้ป่วย';
};

appointmentSchema.methods.getPatientPhone = function (this: IAppointmentDocument): string {
    if (this.patient.isRegistered && this.populated('patient.patientId')) {
        const patient = this.patient.patientId as any;
        return patient.phone || '';
    }

    if (!this.patient.isRegistered) {
        return this.patient.phone || '';
    }

    return '';
};

appointmentSchema.methods.getPatientEmail = function (this: IAppointmentDocument): string | undefined {
    if (this.patient.isRegistered && this.populated('patient.patientId')) {
        const patient = this.patient.patientId as any;
        return patient.email;
    }

    if (!this.patient.isRegistered) {
        return this.patient.email;
    }

    return undefined;
};

appointmentSchema.methods.calculateDuration = function (this: IAppointmentDocument): number {
    return calculateDuration(this.startTime, this.endTime);
};

appointmentSchema.methods.isConflictWith = function (this: IAppointmentDocument, other: IAppointmentDocument): boolean {
    // ตรวจสอบว่าเป็นวันเดียวกันและแพทย์คนเดียวกันหรือไม่
    if (this.appointmentDate.toDateString() !== other.appointmentDate.toDateString() ||
        this.doctorId.toString() !== other.doctorId.toString()) {
        return false;
    }

    const thisStart = this.appointmentDateTime;
    const thisEnd = combineDateTime(this.appointmentDate, this.endTime);
    const otherStart = other.appointmentDateTime;
    const otherEnd = combineDateTime(other.appointmentDate, other.endTime);

    // ตรวจสอบการทับซ้อนของเวลา
    return thisStart < otherEnd && thisEnd > otherStart;
};

/**
 * Static Methods
 */
appointmentSchema.statics.findByDoctor = function (
    doctorId: string,
    startDate?: Date,
    endDate?: Date
) {
    const query: any = { doctorId, isActive: true };

    if (startDate && endDate) {
        query.appointmentDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
        query.appointmentDate = { $gte: startDate };
    } else if (endDate) {
        query.appointmentDate = { $lte: endDate };
    }

    return this.find(query)
        .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
        .populate('patient.patientId', 'hn titlePrefix firstNameTh lastNameTh phone email')
        .populate('branchId', 'name')
        .populate('clinicId', 'name')
        .sort({ appointmentDate: 1, startTime: 1 });
};

appointmentSchema.statics.findByPatient = function (patientId: string) {
    return this.find({
        'patient.patientId': patientId,
        'patient.isRegistered': true,
        isActive: true
    })
        .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
        .populate('branchId', 'name')
        .populate('clinicId', 'name')
        .sort({ appointmentDate: -1 });
};

appointmentSchema.statics.findConflicts = function (
    doctorId: string,
    appointmentDate: Date,
    startTime: string,
    endTime: string,
    excludeId?: string
) {
    const query: any = {
        doctorId,
        appointmentDate,
        isActive: true,
        status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] }
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    return this.find(query).then((appointments: IAppointmentDocument[]) => {
        const newStart = combineDateTime(appointmentDate, startTime);
        const newEnd = combineDateTime(appointmentDate, endTime);

        return appointments.filter(appointment => {
            const existingStart = combineDateTime(appointment.appointmentDate, appointment.startTime);
            const existingEnd = combineDateTime(appointment.appointmentDate, appointment.endTime);

            return newStart < existingEnd && newEnd > existingStart;
        });
    });
};

/**
 * Pre-save Middleware
 */
appointmentSchema.pre('save', function (this: IAppointmentDocument, next) {
    // คำนวณ duration อัตโนมัติ
    if (this.startTime && this.endTime) {
        this.duration = calculateDuration(this.startTime, this.endTime);
    }

    // ตรวจสอบว่าเวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น
    if (this.duration <= 0) {
        return next(new Error('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น'));
    }

    // ตรวจสอบระยะเวลาขั้นต่ำ
    if (this.duration < 15) {
        return next(new Error('การนัดหมายต้องมีระยะเวลาอย่างน้อย 15 นาที'));
    }

    next();
});

/**
 * Pre-validate Middleware
 */
appointmentSchema.pre('validate', function (this: IAppointmentDocument, next) {
    // ตรวจสอบข้อมูลผู้ป่วยตาม discriminated union
    if (this.patient) {
        if (this.patient.isRegistered) {
            // ผู้ป่วยในระบบต้องมี patientId
            if (!this.patient.patientId) {
                return next(new Error('ผู้ป่วยในระบบต้องระบุ patientId'));
            }
            // ล้างข้อมูลผู้ป่วยนอกระบบ
            (this.patient as any).name = undefined;
            (this.patient as any).phone = undefined;
            (this.patient as any).email = undefined;
        } else {
            // ผู้ป่วยนอกระบบต้องมี name และ phone
            if (!this.patient.name || !this.patient.phone) {
                return next(new Error('ผู้ป่วยนอกระบบต้องระบุชื่อและเบอร์โทรศัพท์'));
            }
            // ล้างข้อมูลผู้ป่วยในระบบ
            (this.patient as any).patientId = undefined;
        }
    }

    next();
});

/**
 * Pre-save middleware สำหรับตั้งค่า clinicId จาก branchId
 */
appointmentSchema.pre('save', async function (this: IAppointmentDocument, next) {
    try {
        // ตั้งค่า clinicId จาก branchId ถ้ายังไม่มี
        if (!this.clinicId && this.branchId) {
            const Branch = mongoose.model('Branch');
            const branch = await Branch.findById(this.branchId);
            if (branch && (branch as any).clinicId) {
                this.clinicId = (branch as any).clinicId;
            }
        }

        next();
    } catch (error) {
        next(error as Error);
    }
});

/**
 * Pre-save middleware สำหรับ validation ขั้นสูง
 */
appointmentSchema.pre('save', async function (this: IAppointmentDocument, next) {
    try {
        // ตรวจสอบว่า branch อยู่ในคลินิกเดียวกันหรือไม่
        if (this.branchId && this.clinicId) {
            const Branch = mongoose.model('Branch');
            const branch = await Branch.findById(this.branchId);
            if (!branch || (branch as any).clinicId.toString() !== this.clinicId.toString()) {
                throw new Error('สาขาที่ระบุไม่อยู่ในคลินิกนี้');
            }
        }

        // ตรวจสอบว่าแพทย์อยู่ในคลินิกเดียวกันหรือไม่
        if (this.doctorId && this.clinicId) {
            const Doctor = mongoose.model('Doctor');
            const doctor = await Doctor.findById(this.doctorId);
            if (!doctor || (doctor as any).clinicId.toString() !== this.clinicId.toString()) {
                throw new Error('แพทย์ที่ระบุไม่อยู่ในคลินิกนี้');
            }
        }

        next();
    } catch (error) {
        next(error as Error);
    }
});

/**
 * Post-save middleware
 */
appointmentSchema.post('save', function (doc) {
    console.log(`Appointment for ${doc.getPatientName()} on ${doc.appointmentDate.toDateString()} at ${doc.startTime} saved successfully`);
});

/**
 * Export Model
 */
export const Appointment = mongoose.model<IAppointmentDocument>('Appointment', appointmentSchema);

export default Appointment;