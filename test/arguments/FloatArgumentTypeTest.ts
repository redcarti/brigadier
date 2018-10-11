import { assert, expect } from 'chai'
import testEquality from "../utils/testEquality"
import CommandSyntaxException from "../../src/lib/exceptions/CommandSyntaxException"
import { Type } from "../../src/lib/arguments/ArgumentType"
import StringReader from '../../src/lib/StringReader';

const {float} = Type;

describe('floatumentTypeTest', () => {
	let type;

	beforeEach(() => {
		type = float(-100, 100);
	})

	it('parse', () => {		
        const reader = new StringReader("15");
        assert.equal(float().parse(reader), 15);
        assert.equal(reader.canRead(), false);
    })

    it('parse_tooSmall', () => {		
        const reader = new StringReader("-5");
        try {
            float(0, 100).parse(reader);
            assert.fail();
        } catch (ex) {
            expect(ex.getType().toString()).to.equal(CommandSyntaxException.BUILT_IN_EXCEPTIONS.floatTooLow().toString());
            assert.equal(ex.getCursor(), 0);
        }
    })

    it('parse_tooBig', () => {		
        const reader = new StringReader("5");
        try {
            float(-100, 0).parse(reader);
            assert.fail();
        } catch (ex) {
            expect(ex.getType().toString()).to.equal(CommandSyntaxException.BUILT_IN_EXCEPTIONS.floatTooHigh().toString());
            assert.equal(ex.getCursor(), 0);
        }
    })

    it('testEquals', () => {		
		testEquality(float(), float())
		testEquality(float(-100, 100), float(-100, 100))
		testEquality(float(-100, 50), float(-100, 50))
		testEquality(float(-50, 100), float(-50, 100))
    })

    it('testToString', () => {		
        assert.equal(float()+ "", "float()");
        assert.equal(float(-100)+ "", "float(-100)");
        assert.equal(float(-100, 100)+ "", "float(-100, 100)");
        assert.equal(float(Number.MIN_SAFE_INTEGER, 100)+ "", "float(-9007199254740991, 100)");
    })
})
