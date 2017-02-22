//jQuery function to manipulate ejs elements

$(function () {

    //put the stripe publish key information here
    Stripe.setPublishableKey('pk_test_rX4jkalWlHZWh0A5YTRuLl2W');

    //search spinjs and get the format
    //this is used as Spinner
    var opts = {
        lines: 13 // The number of lines to draw
        , length: 28 // The length of each line
        , width: 14 // The line thickness
        , radius: 42 // The radius of the inner circle
        , scale: 1 // Scales overall size of the spinner
        , corners: 1 // Corner roundness (0..1)
        , color: '#000' // #rgb or #rrggbb or array of colors
        , opacity: 0.25 // Opacity of the lines
        , rotate: 0 // The rotation offset
        , direction: 1 // 1: clockwise, -1: counterclockwise
        , speed: 1 // Rounds per second
        , trail: 60 // Afterglow percentage
        , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
        , zIndex: 2e9 // The z-index (defaults to 2000000000)
        , className: 'spinner' // The CSS class to assign to the spinner
        , top: '50%' // Top position relative to parent
        , left: '50%' // Left position relative to parent
        , shadow: false // Whether to render a shadow
        , hwaccel: false // Whether to use hardware acceleration
        , position: 'absolute' // Element positioning
    }

    var target = document.getElementById('foo');
    var spinner = new Spinner(opts).spin(target);


    //use ajax to achieve instant search function on current page
    $('#search').keyup(function () {

        var search_term = $(this).val();

        $.ajax({
            method:'post',
            url:'/api/search',
            data:{
                search_term
            },
            dataType:'json',
            success:function (json) {
                var data = json.hits.hits;

                $('#searchResults').empty();
                for (var i = 0 ; i<data.length;i++){
                    var html = "";
                    html+= '<div class="col-md-4">';
                    html+= '<a href="/product/' + data[i]._id + '">';
                    html+= '<div class = "thumbnail">';
                    html+= '<img src="' +  data[i]._source.image + '">';
                    html+= '<div class="caption">';
                    html+= '<h3>' + data[i]._source.name +'</h3>';
                    html+= '<p>' + '$' + data[i]._source.price + '</p>';
                    html+= '</div> </div> </a> </div>';
                    $('#searchResults').append(html);
                }
            },
            error:function (err) {
                console.log(err);
            }
        });
    });

    //let the plus function work
    $(document).on('click','#plus',function (e) {
        e.preventDefault();
        var priceValue = parseFloat($('#priceValue').val());
        var quantity = parseInt($('#quantity').val());

        priceValue += parseFloat($('#priceHidden').val());
        quantity += 1;

        $('#quantity').val(quantity);
        $('#priceValue').val(priceValue.toFixed(2));
        $('#total').html(quantity);
    });

    //let the minus function work
    $(document).on('click','#minus',function (e) {
        e.preventDefault();
        var priceValue = parseFloat($('#priceValue').val());
        var quantity = parseInt($('#quantity').val());

        //limit the minimum amount of quantity to 1
        if (quantity == 1){
            priceValue = $('#priceHidden').val();
            quantity = 1;
        } else {
            priceValue -= parseFloat($('#priceHidden').val());
            quantity -= 1;
        }

        $('#quantity').val(quantity);
        $('#priceValue').val(priceValue.toFixed(2));
        $('#total').html(quantity);
    });

    //go to stripe Payment and use official code
    var $form = $('#payment-form');
    $form.submit(function(event) {

        // Disable the submit button to prevent repeated clicks:
        $form.find('button').prop('disabled', true);

        Stripe.card.createToken($form, stripeResponseHandler);

        // Prevent the form from being submitted:
        return false;
    });

   //send payment to server
    function stripeResponseHandler(status, response) {
        // Grab the form:
        var $form = $('#payment-form');

        if (response.error) { // Problem!

            // Show the errors on the form:
            $form.find('.payment-errors').text(response.error.message);
            console.log('error message :' + response.error.message);
            $form.find('.submit').prop('disabled', false); // Re-enable submission

        } else { // Token was created!

            // Get the token ID:
            var token = response.id;

            // Insert the token ID into the form so it gets submitted to the server:
            $form.append($('<input type="hidden" name="stripeToken">').val(token));

            var spinner = new Spinner(opts).spin();
            $('#loading').append(spinner.el);

            // Submit the form:
            $form.get(0).submit();
        }
    };

});