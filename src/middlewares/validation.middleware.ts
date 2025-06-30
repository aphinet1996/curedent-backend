import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './error.middleware';
import { logger } from '../utils/logger';

interface ValidationSchema {
    body?: Joi.Schema;
    query?: Joi.Schema;
    params?: Joi.Schema;
}

const validationOptions: Joi.ValidationOptions = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
};

const translateErrorMessage = (message: string): string => {
    const dictionary: Record<string, string> = {
        'is required': 'จำเป็นต้องระบุ',
        'must be a valid email': 'ต้องเป็นอีเมลที่ถูกต้อง',
        'must be a string': 'ต้องเป็นข้อความ',
        'must be a number': 'ต้องเป็นตัวเลข',
        'must be a boolean': 'ต้องเป็นค่าจริงหรือเท็จ',
        'must be one of': 'ต้องเป็นหนึ่งในค่า',
        'must be less than or equal to': 'ต้องมีค่าน้อยกว่าหรือเท่ากับ',
        'must be greater than or equal to': 'ต้องมีค่ามากกว่าหรือเท่ากับ',
        'is not allowed to be empty': 'ห้ามเป็นค่าว่าง',
        'length must be': 'ความยาวต้องเป็น',
        'must contain at least': 'ต้องมีอย่างน้อย',
        'characters long': 'ตัวอักษร',
        'must match': 'ต้องตรงกับ',
        'must be a valid': 'ต้องถูกต้องตามรูปแบบ',
    };

    let translatedMessage = message;
    Object.entries(dictionary).forEach(([english, thai]) => {
        translatedMessage = translatedMessage.replace(new RegExp(english, 'g'), thai);
    });

    return translatedMessage;
};

const formatValidationErrors = (error: Joi.ValidationError): string => {
    const errors = error.details.map((detail) => {
        const path = detail.path.map((p) => (typeof p === 'string' ? p : String(p))).join('.');
        const message = translateErrorMessage(detail.message);

        return `${path} ${message.replace(/"/g, '')}`;
    });

    return errors.join(', ');
};

export const validate = (schema: ValidationSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validKeys = ['body', 'query', 'params'] as const;
        type ValidKey = typeof validKeys[number];

        validKeys.forEach((key: ValidKey) => {
            const validationSchema = schema[key];
            const dataToValidate = req[key];

            if (validationSchema) {
                const { error, value } = validationSchema.validate(dataToValidate, validationOptions);

                if (error) {
                    const errorMessage = formatValidationErrors(error);
                    logger.debug(`Validation error in ${key}: ${errorMessage}`);

                    return next(new AppError(errorMessage, 400));
                }

                if (key === 'query') {
                    Object.assign(req.query, value);
                } else {
                    req[key] = value;
                }
            }
        });

        next();
    };
};

export const commonValidations = {
    objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
        'string.pattern.base': 'ID ไม่ถูกต้องตามรูปแบบ',
    }),

    email: Joi.string().email().lowercase().messages({
        'string.email': 'อีเมลไม่ถูกต้อง',
        'string.empty': 'กรุณาระบุอีเมล',
    }),

    username: Joi.string().min(3).max(30).lowercase().pattern(/^[a-zA-Z0-9_]+$/).messages({
        'string.pattern.base': 'ชื่อผู้ใช้ต้องประกอบด้วยตัวอักษร ตัวเลข และ _ เท่านั้น',
        'string.min': 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย {#limit} ตัวอักษร',
        'string.max': 'ชื่อผู้ใช้ต้องมีความยาวไม่เกิน {#limit} ตัวอักษร',
        'string.empty': 'กรุณาระบุชื่อผู้ใช้',
    }),

    password: Joi.string().min(6).max(30).messages({
        'string.min': 'รหัสผ่านต้องมีความยาวอย่างน้อย {#limit} ตัวอักษร',
        'string.max': 'รหัสผ่านต้องมีความยาวไม่เกิน {#limit} ตัวอักษร',
        'string.empty': 'กรุณาระบุรหัสผ่าน',
    }),

    name: Joi.string().min(1).max(50).messages({
        'string.min': 'ชื่อต้องมีความยาวอย่างน้อย {#limit} ตัวอักษร',
        'string.max': 'ชื่อต้องมีความยาวไม่เกิน {#limit} ตัวอักษร',
        'string.empty': 'กรุณาระบุชื่อ',
    }),

    page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'หน้าต้องเป็นตัวเลข',
        'number.integer': 'หน้าต้องเป็นจำนวนเต็ม',
        'number.min': 'หน้าต้องมีค่าอย่างน้อย {#limit}',
    }),

    limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'จำนวนรายการต่อหน้าต้องเป็นตัวเลข',
        'number.integer': 'จำนวนรายการต่อหน้าต้องเป็นจำนวนเต็ม',
        'number.min': 'จำนวนรายการต่อหน้าต้องมีค่าอย่างน้อย {#limit}',
        'number.max': 'จำนวนรายการต่อหน้าต้องมีค่าไม่เกิน {#limit}',
    }),

    sortBy: Joi.string().messages({
        'string.empty': 'กรุณาระบุฟิลด์ที่ต้องการเรียงลำดับ',
    }),

    sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
        'any.only': 'การเรียงลำดับต้องเป็น asc หรือ desc เท่านั้น',
    }),
};

export default validate;