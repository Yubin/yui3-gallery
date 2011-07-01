YAHOO.env.classMap = {"Paginator": "gallery-paginator", "Paginator.ui.FirstPageLink": "gallery-paginator", "Node~optimizations": "node", "Paginator.ui.LastPageLink": "gallery-paginator", "Plugin.OverlayForm": "gallery-formmgr-overlay-plugin", "ComplexMath": "gallery-complexnumber", "Accordion": "gallery-accordion-horiz-vert", "MathFunction.InverseHyperbolicCosine": "gallery-mathcanvas", "Paginator.ui.PreviousPageLink": "gallery-paginator", "MathFunction.Pi": "gallery-mathcanvas", "Node~scrollIntoView": "node", "MathCanvas": "gallery-mathcanvas", "MathFunction.Value": "gallery-mathcanvas", "Paginator.ui.ValidationPageLinks": "gallery-paginator", "MathFunction.Logarithm": "gallery-mathcanvas", "SelectAllCheckboxGroup": "gallery-checkboxgroups", "MathFunction.Arctangent": "gallery-mathcanvas", "MultiObject": "gallery-multiobject", "MathFunction.Cosine": "gallery-mathcanvas", "Paginator.ui.RowsPerPageDropdown": "gallery-paginator", "FormManager": "gallery-formmgr-css-validation", "MathFunction.Sine": "gallery-mathcanvas", "Math": "gallery-math", "MathCanvas.Parser": "gallery-mathcanvas", "MathFunction.Variable": "gallery-mathcanvas", "Paginator.ui.NextPageLink": "gallery-paginator", "Paginator.ui.CurrentPageInput": "gallery-paginator", "EnableIfAnyCheckboxGroup": "gallery-checkboxgroups", "MathFunction.Negate": "gallery-mathcanvas", "MathFunction.InverseHyperbolicTangent": "gallery-mathcanvas", "Node~dimensions": "node", "MathFunction.Phase": "gallery-mathcanvas", "MathFunction.SquareRoot": "gallery-mathcanvas", "MathFunction.FunctionWithArgs": "gallery-mathcanvas", "MathFunction.HyperbolicCosine": "gallery-mathcanvas", "Assert": "gallery-test-extras", "MathFunction.HyperbolicSine": "gallery-mathcanvas", "MathFunction.Rotate": "gallery-mathcanvas", "MathFunction.I": "gallery-mathcanvas", "CheckboxGroup": "gallery-checkboxgroups", "QueryBuilder": "gallery-querybuilder", "Plugin.DataTableQuickEdit": "gallery-quickedit", "MathFunction.InverseHyperbolicSine": "gallery-mathcanvas", "MathFunction.Sum": "gallery-mathcanvas", "MathFunction.HyperbolicTangent": "gallery-mathcanvas", "MathFunction.E": "gallery-mathcanvas", "MathFunction.Magnitude": "gallery-mathcanvas", "AtLeastOneCheckboxGroup": "gallery-checkboxgroups", "MathFunction.Tangent": "gallery-mathcanvas", "MathFunction.Conjugate": "gallery-mathcanvas", "MathFunction.Quotient": "gallery-mathcanvas", "MathFunction.Arctangent2": "gallery-mathcanvas", "Column": "gallery-quickedit", "MathFunction": "gallery-mathcanvas", "MathFunction.RealPart": "gallery-mathcanvas", "ExpressionBuilder": "gallery-exprbuilder", "InstanceManager": "gallery-instancemanager", "Chipper": "gallery-chipper", "QueryBuilder.String": "gallery-querybuilder", "io~multiresponse": "io", "MathFunction.Arccosine": "gallery-mathcanvas", "MathCanvas.RectList": "gallery-mathcanvas", "Plugin.Neon": "gallery-neon", "MathFunction.NaturalLog": "gallery-mathcanvas", "Canvas.Context2d": "gallery-canvas", "MathFunction.Exponential": "gallery-mathcanvas", "MathFunction.Arcsine": "gallery-mathcanvas", "Plugin.ConsoleTest": "gallery-console-test", "Plugin.FixedSizeAccordion": "gallery-accordion-horiz-vert", "ArrayList": "gallery-algorithms", "Paginator.ui.ItemRangeDropdown": "gallery-paginator", "MathFunction.Product": "gallery-mathcanvas", "TreebleDataSource": "gallery-treeble", "ComplexNumber": "gallery-complexnumber", "QueryBuilder.Select": "gallery-querybuilder", "MathFunction.Max": "gallery-mathcanvas", "Paginator.ui.CurrentPageReport": "gallery-paginator", "MathFunction.Min": "gallery-mathcanvas", "Array": "gallery-algorithms", "Paginator.ui.PageLinks": "gallery-paginator", "AtMostOneCheckboxGroup": "gallery-checkboxgroups", "MathFunction.ImaginaryPart": "gallery-mathcanvas", "Treeble": "gallery-treeble"};

YAHOO.env.resolveClass = function(className) {
    var a=className.split('.'), ns=YAHOO.env.classMap;

    for (var i=0; i<a.length; i=i+1) {
        if (ns[a[i]]) {
            ns = ns[a[i]];
        } else {
            return null;
        }
    }

    return ns;
};
