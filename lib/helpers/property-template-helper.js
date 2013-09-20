module.exports = function() {
    
    return {
        extendTestCase: function(testCase) {

            testCase.propertyTemplate = function(template) {
                var self = this;
                var parsedTemplate = [];
                var parts = template.split('{{');

                parts.forEach(function(p) {
                    var a = p.split("}}");
                    
                    if(a.length === 2) {
                        var placeHolder = a.shift();
                        var prop = this.property(placeHolder);
                        parsedTemplate.push(prop);
                    }
                    if(a.length === 1) {
                        var text = a.shift();
                        parsedTemplate.push(text);
                    }
                    if(a.length !== 0) {
                        throw new Error("invalid template: " + template);
                    }
                }, this);

                
                return {
                    evaluate: function(root) {
                        return parsedTemplate.reduce(function(result, tp) {
                            if(typeof tp === "string") {
                                return result + tp;
                            } else {
                                return result + self.evaluate(tp);
                            }
                        }, "");
                    }
                };
            };
        }
    };
};