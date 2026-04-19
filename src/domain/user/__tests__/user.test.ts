import {validateRegistration, fullName, UserValidationError} from '../index'

describe('user domain', () => {
    it('validateRegistration splits name and normalises', () => {
        const parsed = validateRegistration({name: 'John Doe', email: 'a@b.co', password: '123456'})
        expect(parsed).toEqual({firstName: 'John', lastName: 'Doe', email: 'a@b.co', password: '123456'})
    })

    it('validateRegistration rejects bad emails', () => {
        expect(() => validateRegistration({name: 'John Doe', email: 'not-an-email', password: '123456'}))
            .toThrow(UserValidationError)
    })

    it('validateRegistration rejects short passwords', () => {
        expect(() => validateRegistration({name: 'John Doe', email: 'a@b.co', password: '12'}))
            .toThrow(UserValidationError)
    })

    it('validateRegistration rejects names without last name', () => {
        expect(() => validateRegistration({name: 'John', email: 'a@b.co', password: '123456'}))
            .toThrow(UserValidationError)
    })

    it('fullName joins parts', () => {
        expect(fullName({firstName: 'Jane', lastName: 'Roe'})).toBe('Jane Roe')
    })
})
