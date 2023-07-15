Feature: A tagged feature

  Background: A background
    #@Precondition:CYP-244
		Given abc123
		Then xyz987

  @CYP-123 @Some @Other @CYP-456 @Tags
  Scenario: A scenario
    Given an assumption
    When a when
    And an and
    Then a then
