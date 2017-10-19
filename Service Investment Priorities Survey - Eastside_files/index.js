$(document).ready(function() {
  
//**********
//Definitions
//**********

  const maxCost = 100;
  const barboxHeight = $(".dashboard").find(".barbox:first").height();
  const region = $("input[name=region]").val();
  var dashboardDockHeight;
  var dashboardUndockHeight;
  var windowHeight;
  var windowWidth;


  // On screens thinner than 768px, hide improvement and investment descriptions and add buttons
  // triggering modals with desriptions.
  const hideDescriptions = () => {
    // Note: "Improvements" and "Investments" share the same modal functionality
    $("label.improvement, label.row").each(function() {
      var improvementName = $(this).find("h3");
      var improvementDescription = $(this).find("p");

      // Hide the improvement description
      improvementDescription.css({ 'display': 'none' });

      // Add 'View Details' a tag (to display hidden description in a modal)
      $(this).find("h3").after("<div><button class='view-details'>View details</button></div>");

      // When 'View Details' is clicked...
      $(this).find("button.view-details").click(function(event) {

        // ...prevent page refresh
        event.preventDefault();

        // ...get offset of button (distance to top of page)
        var top = $(this).offset().top;

        // ...populate modal with improvement name and description
        $(".modal-content")
          .append('<h3>' + improvementName.html().split(' <')[0] + ':</h3>')
          .append('<p>' + improvementDescription.text() + '</p>')

        openModal();
      });
    });
  };

  // Get dimensions of browser window for 
  //   (a) brute force dashboard placement
  //   (b) determination of whether improvement and investment descriptions are hidden (<768px wide)
  const getWindowDimensions = () => {
    // Dashboard "docks" to top of screen when initial dashboard location is scrolled past
    dashboardDockHeight = $(".dashboard").offset().top;

    // Dashboard "undocks" and returns to original location when last upgrade is scrolled past
    dashboardUndockHeight = $(".upgrade:last").offset().top + $(".upgrade:last").height() - $(".dashboard:last").height();

    windowHeight = $(window).height();
    windowWidth = $(window).width();
  };

  // Update total cost of selected upgrades displayed in dashboard
  const updateTotalCost = () => {
    //initialize total cost at 0
    var totalCost = 0;

    //iterate through selected improvements, adding each cost to the total
    $(".upgrade").find(":checked").each(function() {
      var $upgrade = $(this).parents(".upgrade");
      totalCost += $upgrade.data("cost");
      $upgrade.addClass("selected");
    })

    //Update the total cost with the new total in the dashboard
    $(".dashboard").find(".cost").text('$' + totalCost);

    // Return totalCost for use in preventBudgetExceedance function
    return totalCost;
  };

  // Update all upgrade attribute (e.g., demand) graphs in dashboard
  const updateUpgradeAttributes = () => {
    //initialize all totals at 0
    var demandTotal = 0;
    var productivityTotal = 0;
    var equityTotal = 0;
    var jobAccessTotal = 0;

    //Iterate through all selected improvements, adding each attribute value to the total
    $(".upgrade").find(":checked").each(function() {
      demandTotal += $(this).parents(".upgrade").data("demand");
      productivityTotal += $(this).parents(".upgrade").data("productivity");
      equityTotal += $(this).parents(".upgrade").data("equity");
      jobAccessTotal += $(this).parents(".upgrade").data("job-access");
    });
    
    //Update the barboxes representing each attribute total
    $(".dashboard").each(function() {
      $(this).find(".demand").find(".barbox").children().css({ 'height': Math.min((demandTotal * 3), barboxHeight)  + 'px' });
      $(this).find(".productivity").find(".barbox").children().css({ 'height': Math.min((productivityTotal * 3), barboxHeight) + 'px' });
      $(this).find(".equity").find(".barbox").children().css({ 'height': Math.min((equityTotal * 3), barboxHeight) + 'px' });
      $(this).find(".job-access").find(".barbox").children().css({ 'height': Math.min((jobAccessTotal * 3), barboxHeight) + 'px' });
    });
  };


  // Prevent users from selecting additional upgrades that would exceed budget
  const preventBudgetExceedence = (totalCost) => {
    //iterate through each unselected improvement
    $(".upgrade").find("input:checkbox:not(:checked)").each(function() {

      //if adding the improvement's cost would exceed budget...
      if ($(this).parents(".upgrade").data("cost") + totalCost > maxCost) {

        //...fake disable the checkbox
        $(this).addClass("disabled");

        //...change text color of displayed cost to red
        $(this).parents(".upgrade").find(".cost").css({ 'color': 'red' });


      //if adding the improvement would not exceed the budget...
      } else {
        //...ensure checkbox is enabled
        $(this).removeClass("disabled");
        
        //...change text color of displayed cost back to original
        $(this).parents(".upgrade").find(".cost").css({ 'color': '' });
      }
    });
  };

  const dockDashboardOnScroll = () => {
    getWindowDimensions();
    var window_top = $(window).scrollTop();

    // if upgrade section of survey is in view...
    if (window_top > dashboardDockHeight && window_top <= dashboardUndockHeight) {

      //...clone dashboard (if it hasn't already been done)
      if ($(".dashboard").length === 1) {
        var contentWidth = $(".upgrade:first").width();
        $(".dashboard").eq(0).after($('.dashboard').clone().addClass('docked').css({ 'width': contentWidth }));

        var dashHeight = $('.dashboard').eq(1).height();
        $(".dashboard").eq(1).after($("<div class='gradient'></div>").css({ 'width': contentWidth + 30, 'top': dashHeight }));

        // Make attributes and their barboxes clickable
        clearAttributeDescriptions();
        addAttributeDescriptions();
      }
    } else {
      // Delete cloned dashboard (if there is one) when upgrade section is not in view
      $(".gradient").remove();
      $(".dashboard").eq(1).remove();

      // Make attributes and their barboxes clickable
      clearAttributeDescriptions();
      addAttributeDescriptions();
    }
  };

  const checkForDuplicateRankings = (comparisonRanking) => {
    var duplicate = false;

    if (comparisonRanking.val() !== '-') {
      $(".improvement-rank").not(comparisonRanking).each(function() {

        if ($(this).val() === comparisonRanking.val()) {
          duplicate = true;
        }
      });
    }
    return duplicate;
  };

  const rankingDuplicateModal = () => {
    $(".modal-content")
      // populate modal with message
      .append("<p>Multiple improvements cannot have the same rank. Please correct before submitting.</p>");

    openModal();
  };

  const escapeHTML = (unsafe) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  const priorSubmissionCheck = () => {
    //var cookies = document.cookie;
    //console.log(cookies);
    if (document.cookie.includes('' + region + 'Submitted=true')) {
      // window.location.replace('error.htm');
      $(".modal-content")

        // populate modal with message
        .append("<p>It looks like you&rsquo;ve already taken the survey for this region. You may still view the survey but will be unable to submit it again.</p>");

      openModal();

      // Disable submit button
      $('.submit').prop('disabled', true);

      // Display no multiple submission message
      $('.no-submit').css({ 'display': 'block' });

      return true;
    } else return false;
  }

  const openModal = () => {
    // open modal
    $(".modal-content, .modal-background").toggleClass("active");
    //lock scrolling
    $("body").css({ 'overflow': 'hidden' });
  }

  const addAttributeDescriptions = () => {
    // Prompt explanatory modal on click of attribute name and barbox
    $(".total.demand").click(function () {
      $(".modal-content")
        // populate modal with message
        .append("<p><strong>Demand</strong> refers to the number of times a rider boards the line in a week.</p>");
      openModal();
    });
    $(".total.productivity").click(function () {
      $(".modal-content")
        // populate modal with message
        .append("<p>Lines with higher <strong>productivity</strong> are more cost-effective per rider.</p>");
      openModal();
    });
    $(".total.equity").click(function () {
      $(".modal-content")
        // populate modal with message
        .append("<p><strong>Equity</strong> refers to the percentage of low income, minority, limited English, youth and people with disabilities living within a quarter mile of the line.</p>");
      openModal();
    });
    $(".total.job-access").click(function () {
      $(".modal-content")
        // populate modal with message
        .append("<p><strong>Job access</strong> is the number of jobs within a quarter mile of the line.</p>");
      openModal();
    });
  }
  const clearAttributeDescriptions = () => {
    $(".total.demand, .total.productivity, .total.equity, .total.job-access").off("click");
  }

//**************
//Implementations
//**************

  // Refresh page when user reaches it via back button
  //$('#refresh').val() === 'yes' ? location.reload() : $('#refresh').val('yes');

  updateTotalCost();
  updateUpgradeAttributes();

  // Check if user has submitted page before
  priorSubmissionCheck();

  // Remove style attr from .content#content div
  $('#content').removeAttr("style");
  
  getWindowDimensions();

  // Hide descriptions and replace with buttons to trigger description modal when browser/screen width < 786px
  if(windowWidth < 768) {
    hideDescriptions();
  }

  // Prompt explanatory modal on click of attribute name and barbox
  addAttributeDescriptions();

  
  // Dock dashboard to top of window when it is scrolled past
  $(window).scroll(dockDashboardOnScroll);


  //Update window-based heights every time browser window is resized
  $(window).resize(function () {
    getWindowDimensions()
    $(".gradient").remove();
    $(".dashboard").eq(1).remove();
    dockDashboardOnScroll();
  });


  // When an upgrade is selected...
  $(".upgrade").find("input:checkbox").click(function(event) {
    if($(this).hasClass("disabled")) {
      event.preventDefault();

      var $upgrade = $(this).parents(".upgrade");
      var height = $upgrade.height;
      //var divTop = $upgrade.offset().top;
      var divTop = $(".dashboard:last").offset().top;
      $(".modal-content")
        // populate modal with message
        .append("<p>Whoops! This will put you over budget. You’ll have to adjust your selections if you want to include this feature in your plan.</p>")

      openModal();

    } else {
      $(this).parents(".upgrade").toggleClass("selected");
      updateUpgradeAttributes();
      //updateTotalCost() also adds class "selected" to selected upgrades and returns the total cost
      preventBudgetExceedence(updateTotalCost());
    }
  });


  // Close modal and remove its contents when the modal or background (or close button) is clicked
  $(".modal-background, .modal-content").click(function() {
      $(".modal-content, .modal-background").toggleClass("active");
      $(".modal-content").find("p, h3").remove();

      // Re-enable scrolling:
      $("body").css({ 'overflow': '' });
  });

  // When an improvement ranking is changed, alert user if the ranking (#) has already been applied
  $(".improvement-rank").change(function() {
    var changedRanking = $(this);
    if (checkForDuplicateRankings(changedRanking)) rankingDuplicateModal(changedRanking);
  });

  // Validate form when submit button is clicked
  $("input:submit").click(function (event) {

    // Check if user has submitted page before - This covers when user hits back button after submission on mobile and tries to resubmit.
    if(priorSubmissionCheck()) {
      event.preventDefault();
    }

    // If no upgrades have been selected...
    if ($(".upgrade").find("input:checkbox:not(:checked)").length === $(".upgrade").length) {
      
      //...prevent form submission
      event.preventDefault();

      //...scroll to dashboard
      $(".dashboard").get(0).scrollIntoView();

      // ...populate modal with message
      $(".modal-content")
        .append('<p>Please select at least one improvement before submitting.</p>')

      openModal();

      return;
    }

    // Check for duplicate improvement ranks
    var duplicateRank = false;
    $(".improvement-rank").each(function() {
      var comparisonRanking = $(this);
      if(checkForDuplicateRankings(comparisonRanking)) duplicateRank = true;
    });

    // If duplicate improvement rank(s) present, prevent submit, inform user with modal
    if(duplicateRank) {
      event.preventDefault();
      $(".improvement-rank-section").get(0).scrollIntoView();
      rankingDuplicateModal();
      return;
    } 

    var unescapedText = $("textarea").val();
    $("textarea").val(escapeHTML(unescapedText));

    // Indicate that user has submitted before
      // Set expiration to 50 days (first number below) from time of submission
      var expiry = new Date();
      expiry.setTime(expiry.getTime()+(50*24*60*60*1000)); 
    document.cookie = "" + region + "Submitted=true; expires=" + expiry.toGMTString();

    //setTimeout(priorSubmissionCheck, 750);
  });

});