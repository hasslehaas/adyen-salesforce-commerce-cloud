/* eslint-disable */
'use strict';

var util = require('./util'),
ajax = require('./ajax');

function pad ( number ) {
    if ( number < 10 ) {
        return '0' + number;
    }
    return number;
}

/**
 * @function
 * @description Initializes Adyen CSE  Billing events
 */
function initializeBillingEvents() {

	$('#billing-submit').on('click', function (e) {
		var radioVal = $('.payment-method-options').find(':checked').val();
		if ('CREDIT_CARD' == radioVal){
		    var $creditCard = $('[data-method="CREDIT_CARD"]');
	        var $selectedCardID = $creditCard.find('input[name$="_selectedCardID"]');

			e.preventDefault();
			
			// FIXME: should be generated server side
		    	var currentDate = new Date();
		    	// TODO: optimize this format ISO 8601
		    	var dateField = currentDate.getUTCFullYear() + '-' + pad( currentDate.getUTCMonth() + 1 ) + '-' + pad( currentDate.getUTCDate() ) + 'T' + pad( currentDate.getUTCHours() ) + ':' + pad( currentDate.getUTCMinutes() ) + ':' + pad( currentDate.getUTCSeconds() ) + '.'
		        + ( currentDate.getUTCMilliseconds() / 1000 ).toFixed( 3 ).slice( 2, 5 ) + 'Z';

	        var encryptedData = $('#dwfrm_billing_paymentMethods_creditCard_encrypteddata');
	        // the public key
	        var key = SitePreferences.ADYEN_CSE_JS_PUBLIC_KEY;
	        
	        var postData = {};
	        var options = {};
   
	        /**
	         * We need encrypt only CVC if we used already saved CC from dropdown list
	         */
	        if ($('#creditCard_number').val().indexOf('*') > -1 && $selectedCardID != null && $selectedCardID.val() !== '') {
	            var cardData = {
                        cvc : $('#creditCard_cvn').val(),
                        generationtime : dateField
                    };
	            options = { enableValidations: false};
	        } else {
    	        var cardData = {
    		            number :  $('#creditCard_number').val(),
    		            cvc : $('#creditCard_cvn').val(),
    		            holderName : $('#creditCard_owner').val(),
    		            expiryMonth : $('#creditCard_expiration_month').val(),
    		            expiryYear : $('#creditCard_expiration_year').val(),
    		            generationtime : dateField
    		        };
	        }
            if (($('#creditCard_number').val().indexOf('*') > -1 || $('#creditCard_cvn').val().indexOf('*') > -1) && encryptedData != null && encryptedData.val() !== '') {
                postData['adyen-encrypted-data'] = encryptedData.val();
            } else {
            		var cseInstance = adyen.encrypt.createEncryption(key, options);
                postData['adyen-encrypted-data'] = cseInstance.encrypt(cardData);
            }
            
            // Clear selectedCardID field if user enter a card number
            if ($('#creditCard_number').val().indexOf('*') === -1) {
                $selectedCardID.val('');
            }

            if (postData['adyen-encrypted-data'] === false) {
	        		$('.form-data-error').html(Resources.ADYEN_CC_VALIDATE);
	        } else {
		        	$('.form-data-error').html('');
		        	encryptedData.val(postData['adyen-encrypted-data']);
		        	$('#creditCard_number').val(maskValue($('#creditCard_number').val()));
			    $('#billing-submit-hidden').trigger('click');
	        }
		}
    });
	$('#adyenCreditCardList').on('change', function () {
		var cardUUID = $(this).val();
		if (!cardUUID) {
			// TODO: clear all fields
			$('.checkout-billing').find('input[name$="_selectedCardID"]').val('');
			$('#creditCard_owner').removeAttr("disabled").val('');
			$('#dwfrm_billing_paymentMethods_creditCard_type').removeAttr("disabled").val($("#dwfrm_billing_paymentMethods_creditCard_type option:first").val());
			$('#creditCard_number').removeAttr("disabled").val('');
			$('#creditCard_expiration_month').val('');
			$('#creditCard_expiration_year').val('');
			$('#creditCard_expiration_cvn').val('');	
		} else {
			populateAdyenCreditCardForm(cardUUID);
		}
	});
	
	/**
	 * @function
	 * @description Fills the Credit Card form with the passed data-parameter and clears the former cvn input
	 * @param {Object} data The Credit Card data (holder, type, masked number, expiration month/year)
	 */
	function setAdyenCCFields(data) {
	    var $creditCard = $('[data-method="CREDIT_CARD"]');
	    $('#creditCard_owner').val(data.holder).trigger('change').attr('disabled', 'disabled');
	    $creditCard.find('select[name$="_type"]').val(data.type).trigger('change').attr('disabled', 'disabled');;
	    $('#creditCard_number').val(data.maskedNumber).trigger('change').attr('disabled', 'disabled');
	    $('#creditCard_expiration_month').val(data.expirationMonth).trigger('change');
	    $('#creditCard_expiration_year').val(data.expirationYear).trigger('change');
	    $('#creditCard_expiration_cvn').val('').trigger('change');
	    $creditCard.find('[name$="creditCard_selectedCardID"]').val(data.selectedCardID).trigger('change');
	}

	/**
	 * @function
	 * @description Updates the credit card form with the attributes of a given card
	 * @param {String} cardID the credit card ID of a given card
	 */
	function populateAdyenCreditCardForm(cardID) {
	    // load card details
	    var url = util.appendParamToURL(Urls.billingSelectCC, 'creditCardUUID', cardID);
	    ajax.getJson({
	        url: url,
	        callback: function (data) {
	            if (!data) {
	                window.alert(Resources.CC_LOAD_ERROR);
	                return false;
	            }
	            setAdyenCCFields(data);
	        }
	    });
	}
}

/**
 * @function
 * @description Initializes Adyen CSE My Account events
 */
/**
 * @function
 * @description Initializes Adyen CSE My Account events
 */
function initializeAccountEvents() {
    $('#add-card-submit').on('click', function (e) {
    		// TODO: fix this to use IDs and we need to change template to not use name attributes
        e.preventDefault();
        var $creditCard = $('#CreditCardForm');
        var $encryptedData = $creditCard.find('input[name*="_encrypteddata"]');
       
		// FIXME: should be generated server side
	    	var currentDate = new Date();
	    	// TODO: optimize this format ISO 8601
	    	var dateField = currentDate.getUTCFullYear() + '-' + pad( currentDate.getUTCMonth() + 1 ) + '-' + pad( currentDate.getUTCDate() ) + 'T' + pad( currentDate.getUTCHours() ) + ':' + pad( currentDate.getUTCMinutes() ) + ':' + pad( currentDate.getUTCSeconds() ) + '.'
	        + ( currentDate.getUTCMilliseconds() / 1000 ).toFixed( 3 ).slice( 2, 5 ) + 'Z';

        var encryptedData = $('#dwfrm_paymentinstruments_creditcards_newcreditcard_encrypteddata');
        // the public key
        var key = SitePreferences.ADYEN_CSE_JS_PUBLIC_KEY;
        var postData = {};
        var options = {};
      
        var cardData = {
	            number :  $('#creditCard_number').val(),
	            cvc : $('#creditCard_cvn').val(),
	            holderName : $('#creditCard_owner').val(),
	            expiryMonth : $('#creditCard_expiration_month').val(),
	            expiryYear : $('#creditCard_expiration_year').val(),
	            generationtime : dateField
        };
    
    		var cseInstance = adyen.encrypt.createEncryption(key, options);
        postData['adyen-encrypted-data'] = cseInstance.encrypt(cardData);
           
        if (postData['adyen-encrypted-data'] === false) {
        		$('.form-data-error').html(Resources.ADYEN_CC_VALIDATE);
        } else {
	        	$('.form-data-error').html('');
	        	encryptedData.val(postData['adyen-encrypted-data']);
	        	$('#creditCard_number').val(maskValue($('#creditCard_number').val()));
		    $('#add-card-submit-hidden').trigger('click');
        }
    });
}

function maskValue(value) {
    if (value && value.length > 4) {
        return value.replace(/\d(?=\d{4})/g, '*');
    } else {
        return '';
    }
}

/**
 * @function
 * @description Initializes Adyen CSE billing events
 */
exports.initBilling = function () {
	initializeBillingEvents();
};

exports.initAccount = function() {
	initializeAccountEvents();
};
