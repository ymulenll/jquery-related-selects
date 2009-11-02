/*
 * jQuery related selects plug-in 0.1
 *
 * http://www.erichynds.com
 *
 * Copyright (c) 2009 Eric Hynds
 *
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
 
(function($){
	var opts = {};
	
	$.fn.relatedSelects = function(options){
		opts = $.extend({}, $.fn.relatedSelects.options, options);

		return this.each(function(){
			
			// cache the jquery object
			var $this = $(this);
			
			// build array of select box names
			var selects = [];
			
			// if the selects option is an array, convert it to an object
			if($.isArray(opts.selects)){
				var arrSelects = opts.selects;
				opts.selects = {};
				for(var i=0; i < arrSelects.length; i++){
					opts.selects[ arrSelects[i] ] = {};
				};
			};
			
			for(key in opts.selects) selects.push(key);
			
			// store array of select box names for this instance
			$this.data('selects', selects);

			// cache the options where the value is empty for each select before processing occurs.
			saveDefaults($this);
			
			// go through each select box & settings passed into options
			$.each(opts.selects, function(elem,o){
				var $select 		= $("select[name='" + elem + "']", $this); // jquery ref to this select box
				var $next 			= next(elem,$this); // the select box after this one
				var selectedValue		= $select.children('option:selected').attr('value'); // currently selected value
				
				// extend specific options for this select
				o = $.extend({
					onChangeLoad: '',
					loadingMessage: 'Loading, please wait...',
					defaultOptionText: $select.data('defaultOption') || 'Choose &raquo;'
				}, opts, o);
				
				// store the new default option text
				$select.data('defaultOption', o.defaultOptionText);
				
				// bind the change event
				$select.change(function(){
					o.onChange.call($select);
					process( $select, $next, elem, o, $this );
				});
			
				// if there is already a selected option in this select and the next one is already populated, skip this iteration
				if(selectedValue && selectedValue.length > 0 && isPopulated($next)) return;
				
				// if this isn't the last select box in the chain, process it
				process( $select, $next, elem, o, $this );
			});
		});
	};
	
	function saveDefaults(context){
		$.each(opts.selects, function(elem,o){
			var $elem = $("select[name='" + elem + "']", context);
			$elem.data('defaultOption', $elem.children('option[value=""]').text());
		});
	};

	function process( $select, $next, elem, o, context ){
		if($next.length === 0) return;
		var thispos = getPosition( elem,context );
		var value = $.trim($select.children('option:selected').attr('value'));
		
		// if this select box's length has been changed to a legit value, and there is another select box after this one
		if( value.length > 0 && value !== o.loadingMessage && $next){
		
			// reset all selects after this one
			resetAfter(elem,context);
			
			// populate the next select
			populate($next,o,context);

		// otherwise, make all the selects after this one disabled and select the first option
		} else if($next) {
			resetAfter(elem,context);
		};
	};
	
	function populate($select,o,context){
		var selects = context.data('selects'), selectors = [], params = [];
		
		// build a selector for each select box in this context
		for(var x=0; x<selects.length; x++){
			selectors.push('select[name="'+selects[x]+'"]');
		};
		
		// take those selectors and serialize the data in them
		params = $( selectors.join(','), context ).serialize();

		// disable this select box, add loading msg
		$select.attr("disabled", "disabled").html('<option>' + o.loadingMessage + '</option>');
		
		// onLoadingStart callback
		o.onLoadingStart.call($select); 
		
		// grab the data
		$.getJSON(o.onChangeLoad, params, function(data){
			var html = '<option value="" selected="selected">' + $select.data('defaultOption') + '</option>';
			
			$.each(data, function(i,item){
				html = html + '<option value="'+i+'">' + item + '</option>';
			});

			$select.html(html).removeAttr('disabled');
			
			// end callback
			o.onLoadingEnd.call($select); 
		});
	};
	
	function isPopulated($select){
		var options = $select.children('option');
		return (options.length === 0 || (options.length === 1 && $select.children('option:selected').attr('value').length === 0)) ? false : true;
	};
	
	function resetAfter(elem,context){
		var thispos = getPosition(elem,context), x, selects = context.data('selects');
		for (x=thispos+1; x < selects.length; x++){
			$("select[name='" + selects[x] + "']", context ).attr("disabled","disabled").children("option:first").attr("selected","selected");
		}
	};
	
	function next(elem,context){
		return $("select[name='" + context.data('selects')[ getPosition(elem,context)+1 ] + "']", context);
	};

	// returns the position of an element in the array
	function getPosition(elem,context){
		var selects = context.data('selects');
		for (var i=0; i < selects.length; i++){
			if(selects[i] == elem) return i;
		}
	};
	
	// default options
	$.fn.relatedSelects.options = {
		selects: {},
		onLoadingStart: function(){},
		onLoadingEnd: function(){},
		onChange: function(){}
	};
	
})(jQuery);
