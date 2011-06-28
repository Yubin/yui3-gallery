/**********************************************************************
 * <p>Inverse trigonometric sine.</p>
 * 
 * @module gallery-mathcanvas
 * @namespace MathFunction
 * @class Arcsine
 * @extends MathFunction.FunctionWithArgs
 * @constructor
 * @param f {MathFunction}
 */

function MathArcsine(
	/* MathFunction */	f)
{
	MathArcsine.superclass.constructor.call(this, "arcsin", f);
}

Y.extend(MathArcsine, MathFunctionWithArgs,
{
	evaluate: function(
		/* map */	var_list)
	{
		return Math.asin(this.args[0].evaluate(var_list));
	}
});

MathFunction.Arcsine = MathArcsine;