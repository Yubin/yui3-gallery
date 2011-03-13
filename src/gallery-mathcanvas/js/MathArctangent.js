/**********************************************************************
 * <p>Inverse trigonometric cosine.</p>
 * 
 * @module gallery-mathcanvas
 * @class Y.MathFunction.Arctangent
 * @constructor
 * @param {number}
 */

function MathArctangent(
	/* MathFunction */	f)
{
	MathArctangent.superclass.constructor.call(this, "arctan", f);
}

Y.extend(MathArctangent, MathFunctionWithArgs,
{
	evaluate: function()
	{
		return Math.atan(this.args[0].evaluate());
	}
});

MathFunction.Arctangent = MathArctangent;
