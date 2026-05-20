Feature: A tagged feature

  Background: A background
    #@Precondition:CYP-244
    # a random comment
    #@Precondition:CYP-262
		Given abc123
    # another comment
    # another tag
    #@Precondition:CYP-647
		Then xyz987

  @CYP-123
  Scenario: A scenario
    Given an assumption
    When a when
    And an and
    Then a then
